import config from "./config.js";
import decode from "./huffman-decoder.js";
import hash from "./index-hash.js";

const toBinString = bytes => bytes.reduce((str, byte) => str + byte.toString(2).padStart(8, "0"), "");

export default hsi => {
	const len = hsi.length;
	if (len > 12) {

		// check magic bytes
		for (let i = 0, len = config.magic.length; i < len; i++) {
			if (hsi[i] !== config.magic[i]) {
				return false;
			}
		}

		// object for image details
		const image = {
			width: hsi[4] << 24 | hsi[5] << 16 | hsi[6] << 8 | hsi[7],
			height: hsi[8] << 24 | hsi[9] << 16 | hsi[10] << 8 | hsi[11],
			meta: []
		},
			header = hsi[12] << 8 | hsi[13] & 255;

		// check width and height is valid
		if (image.width > 0 && image.height > 0 && image.height < (2147483647 / image.width | 0)) {
			let offset = 14;

			// decode the header
			if (header) {
				image.meta = new TextEncoder().decode(hsi.slice(offset, header + offset)).split("\n").reduce((obj, item) => {
					const parts = item.split(":", 2);
					obj[parts[0]] = parts[1];
					return obj;
				}, {});
				offset += header;
			}

			// decode the huffman code
			const bytes = decode(hsi.slice(offset), 1),
				pixelsize = image.width * image.height,
				pixels = new Uint8ClampedArray(pixelsize * 4), // one byte each for RGBA
				index = new Array(256);
				console.log(bytes);
			offset = 0;

			// set index 0 to white
			index[0] = [255, 255, 255, 255];

			// setup tracking vars
			let pixel = index[0],
				i = 0;

			// loop through each pixel
			for (; i < pixelsize;) {
				const command = bytes[offset++];

				// QOI_OP_INDEX
				if (command < 2) {
					pixel = [bytes[offset], bytes[offset + 1], bytes[offset + 2], command ? bytes[offset + 3] : pixel[3]];
					offset += command ? 4 : 3;

				// } else if (command === 2) {
				// 	pixel = index[hsi[offset++]];
				//
				// // QOI_OP_DIFF
				// } else if (command === 1) {
				// 	pixel = [pixel[0] + ((byte >> 4) - 4 - 2), pixel[1] + ((byte >> 2 & 3) - 2), pixel[2] + (byte & 3) - 2, pixel[3]];
				//
				// // QOI_OP_LUMA
				// } else if (command === 2) {
				// 	const next = qoi[offset++],
				// 		luma = byte - 160;
				// 	pixel = [pixel[0] + (luma + (next >> 4) - 8), pixel[1] + luma, pixel[2] + luma + (next & 15) - 8, pixel[3]];
				//
				// // QOI_OP_RUN
				// } else if (byte < 254) {
				// 	const run = byte - 191; // shift value to remove run marker
				// 	for (let r = 0; r < run; r++) {
				// 		data.set(pixel, (i + r) * 4);
				// 	}
				// 	i += run;
				// 	continue;
				//
				// // QOI_OP_RGB || QOI_OP_RGBA
				// } else {
				// 	const alpha = byte !== 254;
				// 	pixel = [qoi[offset], qoi[offset + 1], qoi[offset + 2], alpha ? qoi[offset + 3] : 255];
				// 	offset += alpha ? 4 : 3;
				}

				// set the index if not 0x00
				// if (command > 0) {
					// index[hash(pixel[0], pixel[1], pixel[2], pixel[3])] = pixel;
				// }

				// add to the data
				pixels.set(pixel, 4 * i++);
			}

			// check output size is what is expected
			// if (offset !== len - 8) {
			// 	return false;
			// }
			image.data = pixels;
			return image;
		}
	}
	return false;
};
