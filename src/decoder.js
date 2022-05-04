/**
 * QOI Decoder
 */
import magic from "./magic.js";
import hash from "./index-hash.js";

export default (qoi, size) => {
	const len = qoi.byteLength;
	if (qoi != null && len > 22) {

		// check magic bytes
		for (let i = 0, len = magic.length; i < len; i++) {
			if (qoi[i] !== magic[i]) {
				return false;
			}
		}

		// object for image details
		const image = {
			width: qoi[4] << 24 | qoi[5] << 16 | qoi[6] << 8 | qoi[7],
			height: qoi[8] << 24 | qoi[9] << 16 | qoi[10] << 8 | qoi[11],
			alpha: qoi[12] === 3,
			linearColorspace: !!qoi[13]
		};

		// check width and height is valid
		if (image.width > 0 && image.height > 0 && image.height < (2147483647 / image.width | 0) && [3, 4].includes(qoi[12]) && qoi[13] < 2) {
			const pixelsize = image.width * image.height,
				data = new Uint8ClampedArray(pixelsize * 4), // one byte each for RGBA
				index = new Array(64);

			// set index 0 to white
			index[0] = [255, 255, 255, 255];

			// setup tracking vars
			let offset = 14,
				pixel = [0, 0, 0, 255],
				i = 0;

			// loop through each pixel
			for (; i < pixelsize;) {
				const byte = qoi[offset++],
					command = byte >> 6;

				// QOI_OP_INDEX
				if (command === 0) {
					pixel = index[byte];

				// QOI_OP_DIFF
				} else if (command === 1) {
					pixel = [pixel[0] + ((byte >> 4) - 4 - 2), pixel[1] + ((byte >> 2 & 3) - 2), pixel[2] + (byte & 3) - 2, pixel[3]];

				// QOI_OP_LUMA
				} else if (command === 2) {
					const next = qoi[offset++],
						luma = byte - 160;
					pixel = [pixel[0] + (luma + (next >> 4) - 8), pixel[1] + luma, pixel[2] + luma + (next & 15) - 8, pixel[3]];

				// QOI_OP_RUN
				} else if (byte < 254) {
					const run = byte - 191; // shift value to remove run marker
					for (let r = 0; r < run; r++) {
						data.set(pixel, (i + r) * 4);
					}
					i += run;
					continue;

				// QOI_OP_RGB || QOI_OP_RGBA
				} else {
					const alpha = byte !== 254;
					pixel = [qoi[offset], qoi[offset + 1], qoi[offset + 2], alpha ? qoi[offset + 3] : 255];
					offset += alpha ? 4 : 3;
				}

				// set the index if not 0x00
				if (command > 0) {
					index[hash(pixel[0], pixel[1], pixel[2], pixel[3])] = pixel;
				}

				// add to the data
				data.set(pixel, 4 * i++);
			}

			// check output size is what is expected
			if (offset !== len - 8) {
				return false;
			}
			image.data = data;
			return image;
		}
	}
	return false;
};
