/**
 * QOI Encoder
 */
import magic from "./magic.js";

export default (width, height, pixels, alpha, linearColorspace) => {

	// setup encoder
	const size = width * height,
		qoi = new Uint8Array(14 + size * (alpha ? 5 : 4) + 8),
		index = new Int32Array(64);

	// magic bytes "qoif"
	for (let i = 0, len = magic.length; i < len; i++) {
		qoi[i] = magic[i];
	}

	// width
	qoi[4] = width >> 24;
	qoi[5] = width >> 16 & 255;
	qoi[6] = width >> 8 & 255;
	qoi[7] = width & 255;

	// height
	qoi[8] = height >> 24;
	qoi[9] = height >> 16 & 255;
	qoi[10] = height >> 8 & 255;
	qoi[11] = height & 255;

	// alpha channel and colour space
	qoi[12] = alpha ? 4 : 3;
	qoi[13] = linearColorspace ? 1 : 0;

	// loop through data
	let len = 14,
		last = -16777216,
		run = 0,
		i = 0;
	for (; i < size; i++) {
		const pixel = pixels[i];

		// QOI_OP_RUN
		if (pixel === last) {
			if (++run === 62 || i >= size) {
				qoi[len++] = 191 + run; // 0x11 + run-length of the previous pixel
				run = 0;
			}
		} else {
			if (run > 0) {
				qoi[len++] = 191 + run;
				run = 0;
			}

			// QOI_OP_INDEX - 0x00 + 6-bit index into the color index array: 0..63
			let indexOffset = ((pixel >> 16) * 3 + (pixel >> 8) * 5 + (pixel & 63) * 7 + (pixel >> 24) * 11) & 63;
			if (pixel === index[indexOffset]) {
				qoi[len++] = indexOffset;

			// Other encoding methods
			} else {
				index[indexOffset] = pixel;
				const r = pixel >> 16 & 255,
					g = pixel >> 8 & 255,
					b = pixel & 255,
					a = pixel >> 24 & 255;

				// QOI_OP_RGBA - encode the pixel as RGBA
				if ((pixel ^ last) >> 24 !== 0) {
					qoi[len] = 255;
					qoi[len + 1] = r;
					qoi[len + 2] = g;
					qoi[len + 3] = b;
					qoi[len + 4] = a;
					len += 5;
				} else {

					// diff between the last pixel and the current
					const dr = r - (last >> 16 & 255),
						dg = g - (last >> 8 & 255),
						db = b - (last & 255);

					// QOI_OP_DIFF - The difference to the current channel values are using a wraparound operation, so 1 - 2 will result in 255, while 255 + 1 will result in 0
					if (dr >= -2 && dr <= 1 && dg >= -2 && dg <= 1 && db >= -2 && db <= 1) {
						qoi[len++] = 106 + (dr << 4) + (dg << 2) + db;
					} else {
						dr -= dg;
						db -= dg;

						// QOI_OP_LUMA
						if (dr >= -8 && dr <= 7 && dg >= -32 && dg <= 31 && db >= -8 && db <= 7) {
							qoi[len] = 160 + dg;
							qoi[len + 1] = 136 + (dr << 4) + db;
							len += 2;

						// QOI_OP_RGB - encode pixel as RGB, starting with 8-bit tag - b11111110
						} else {
							qoi[len] = 254;
							qoi[len + 1] = r;
							qoi[len + 2] = g;
							qoi[len + 3] = b;
							len += 4;
						}
					}
				}
			}
			last = pixel;
		}
	}
	qoi.fill(0, len, len + 7);
	qoi[len + 7] = 1;
	return qoi;
};
