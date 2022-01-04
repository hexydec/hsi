import getBytes from "./get-bytes.js";
import config from "./config.js";

// extract the bit value
let bits = "";
const getBit = (byte, bit) => {
	const bitmask = 1 << bit,
		left = byte & bitmask;
	bits += left >>> bit;
	return left >>> bit;
},

toBinString = bytes => bytes.reduce((str, byte) => str + byte.toString(2).padStart(8, "0"), "");

export default (data, cmdlen = 0) => {

	// read the huffman tree structure
	let byte = 0,
		bit = 7,
		t = 0;
	const commands = [],
		getFolders = data => {
			const tree = [];
			for (let i = 0; i < 2; i++) {

				// extract the bit value
				const val = getBit(data[byte], bit),
					cmd = [];

				// increment the bits and bytes
				for (let n = 0; n <= val ? cmdlen : 0; n++) {

					// get the command bits
					if (n) {
						cmd.push(getBit(data[byte], bit));
					}

					// move to the next bit
					bit--;
					if (bit < 0) {
						byte++;
						bit = 7;
					}
				}

				// construct the value
				if (val) {
					const command = getBytes(cmd)[0];
					tree.push({
						command: command,
						index: t++
					});
					commands.push(command);
				} else {
					tree.push(getFolders(data));
				}
			}
			return tree;
		},
		tree = getFolders(data);
	console.log(toBinString(data.slice(0, byte)), byte, commands);
	byte++;

	// recover the index data
	const index = [];
	for (let i = 0, len = commands.length; i < len; i++) {
		const indexBytes = config.commands[commands[i]];
		index.push(data.slice(byte, byte + indexBytes));
		byte += indexBytes;
	}
	// console.log(byte, toBinString(data.slice(byte)));

	// decode the huffman stream
	let output = new Uint8ClampedArray(0),
		item = tree;
	for (const len = data.length; byte < len; byte++) {
		for (let i = 7; i >= 0; i--) {
			const bit = getBit(data[byte], i);
			item = item[bit];

			// get the value
			if (!Array.isArray(item)) {
				const arr1 = output,
					arrlen = arr1.length,
					arr2 = [item.command].concat(Array.from(index[item.index]));
				output = new Uint8ClampedArray(arrlen + arr2.length);
				output.set(arr1);
				output.set(arr2, arrlen);
				item = tree;
			}
		}
	}
	return output;
};
