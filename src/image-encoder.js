import encode from "./huffman-encoder.js";
import config from "./config.js";

export default (width, height, image, meta = {}) => {

	// build meta data string first
	console.time("Compile Header");
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
	console.timeEnd("Compile Header");

	// build uncompressed byte stream
	console.time("Encode Pixel Data");
	let last = -1,
		e = 0;
	const data = [],
		index = new Int32Array(256);
	for (let i = 0, len = image.length; i < len; i += 4) {
		const pixel = image[i] * 3 + image[i + 1] * 5 + image[i + 2] * 7 + image[i + 3] * 11;

		// HSI_OP_INDEX
		let indexOffset = pixel % 256;
		// if (pixel === index[indexOffset]) {
		// 	data.push([2, indexOffset]);
		//
		// } else {
		// 	index[indexOffset] = pixel;

			// HSI_OP_RGB
			if (image[i + 3] === (last & 255)) {
				data.push([0, image[i], image[i + 1], image[i + 2]]);

			// HSI_OP_RGBA
			} else {
				data.push([1, image[i], image[i + 1], image[i + 2], image[i + 3]]);
			}
		// }
		last = pixel;
	}
	console.timeEnd("Encode Pixel Data");

	// huffman encode the compressed data
	const huffman = encode(data),
		len = huffman.length,
		output = new Uint8ClampedArray(offset + len);
	output.set(bytes);
	output.set(huffman, offset);
	console.log("Input bytes: " + image.length);
	console.log("Packed bytes: " + data.length);
	console.log("Output bytes: " + output.length);

	// return the bytes
	return output;
};
