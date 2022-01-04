import encode from "./huffman-encoder.js";
import config from "./config.js";

const toBinString = bytes => bytes.reduce((str, byte) => str + byte.toString(2).padStart(8, "0"), "");

export default (width, height, image, meta = {}) => {

	// build meta data string first
	let header = "";
	for (let i = 0, keys = Object.keys(meta), len = keys.length; i < len; i++) {
		header += (header ? "\n" : "") + keys[i] + ":" + meta[keys[i]];
	}
	const headerBytes = new TextEncoder().encode(header),
		headerLen = headerBytes.length,
		total = width * height,
		offset = 14 + headerLen,
		bytes = new Uint8ClampedArray(offset);
	bytes.set(

		// magic bytes
		config.magic.concat([

			// width
			width >> 24, width >> 16 & 255, width >> 8 & 255, width & 255,

			// height
			height >> 24, height >> 16 & 255, height >> 8 & 255, height & 255,

			// header length
			headerLen >> 8 & 255, headerLen & 255

		// header bytes
		])
	);
	bytes.set(headerBytes, 14);

	// build uncompressed byte stream
	let last = -1,
		e = 0;
	const data = [];
	for (let i = 0, len = image.length; i < len; i += 4) {
		const pixel = image[i] << 24 | image[i + 1] << 16 | image[i + 2] << 8 | image[i + 3];

		// HSI_OP_RGB
		if (image[i + 3] === (last & 255)) {
			data.push([0, image[i], image[i + 1], image[i + 2]]);

		// HSI_OP_RGBA
		} else {
			data.push([1, image[i], image[i + 1], image[i + 2], image[i + 3]]);
		}
		last = pixel;
	}
	console.log(data);

	// huffman encode the compressed data
	const huffman = encode(data),
		len = huffman.length,
		output = new Uint8ClampedArray(offset + len);
	output.set(bytes);
	output.set(huffman, offset);

	// return the bytes
	return output;
};
