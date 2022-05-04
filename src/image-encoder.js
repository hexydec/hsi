import encode from "./huffman-encoder.js";
import config from "./config.js";
import hash from "./index-hash.js";
import bytesToInt from "./bytes-to-int.js";

export default (width, height, image, meta = {}) => {

	// build meta data string first
	console.time("Encoder: Compile Header");
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
		])
	);

	// header bytes
	bytes.set(headerBytes, 14);
	console.timeEnd("Encoder: Compile Header");

	// build uncompressed byte stream
	console.time("Encoder: Encode Pixel Data");
	let last = 4294967295, //bytesToInt([255, 255, 255, 255]);
		run = 0,
		packed = 0;
	const data = [],
		index = new Array(256);
	index[242] = last;
	for (let i = 0, len = image.length; i < len; i += 4) {
		const item = [image[i], image[i + 1], image[i + 2], image[i + 3]], //image.slice(i, i + 4), // get current pixel bytes
			pixel = bytesToInt(item); // convert to unsigned 32-bit integer

		// HSI_OP_RUN
		if (pixel === last) {
			if (++run === 256 || i + 4 === len) {
				data.push([4, run]);
				run = 0;
				packed += 2;
			}
		} else {

			// resolve any outstanding HSI_OP_RUN
			if (run) {
				data.push([4, run]);
				run = 0;
				packed += 2;
			}

			const offset = hash(item, 256); // get index position in 256 positions

			// HSI_OP_INDEX
			if (pixel === index[offset]) {
				data.push([2, offset]);
				packed += 2;

			} else {
				index[offset] = pixel;

				// HSI_OP_GREY
				if ((new Set(item.slice(0, 3))).size === 1 && item[3] === (last & 255)) {
					data.push([3, item[0]]);
					packed += 2;

				// HSI_OP_RGB
				} else if (item[3] === (last & 255)) {
					// console.log(item, offset);
					// return;
					data.push([0, item[0], item[1], item[2]]);
					packed += 4;

				// HSI_OP_RGBA
				} else {
					data.push([1, item[0], item[1], item[2], item[3]]);
					packed += 5;
				}
			}
			last = pixel;
		}
	}
	console.timeEnd("Encoder: Encode Pixel Data");

	// huffman encode the compressed data
	const cmdlen = Math.ceil(Math.log2(config.commands.length)),
		huffman = encode(data, cmdlen),
		len = huffman.length,
		output = new Uint8ClampedArray(offset + len);
	output.set(bytes);
	output.set(huffman, offset);
	console.log("Input bytes: " + image.length);
	console.log("Packed bytes: " + packed, packed / image.length);
	console.log("Output bytes: " + output.length, output.length / image.length, output.length / packed);

	// return the bytes
	return output;
};
