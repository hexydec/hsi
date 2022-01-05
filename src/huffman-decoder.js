import getBytes from "./get-bytes.js";
import config from "./config.js";

// extract the bit value
const getBit = (byte, bit) => {
	const bitmask = 1 << bit,
		left = byte & bitmask;
	return left >>> bit;
};

export default (data, cmdlen = 0) => {

	// read the huffman tree structure
	let byte = 0,
		bit = 7,
		t = 0;
	const getTree = (data, bits = []) => {
		let commands = [];
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
				commands.push({
					command: getBytes(Array(8 - cmd.length).fill(0).concat(cmd))[0],
					id: bits.join("") + i
				});
			} else {
				commands = commands.concat(getTree(data, bits.concat(i)));
			}
		}
		return commands;
	},
		commands = getTree(data);

	// increment to the next byte if in the middle of a bit
	if (bit < 7) {
		byte++;
	}

	// recover the index data
	const index = {};
	for (let i = 0, len = commands.length; i < len; i++) {
		const indexBytes = config.commands[commands[i].command],
			id = commands[i].id;
		index[id] = new Uint8ClampedArray(indexBytes + 1);
		index[id].set([commands[i].command]);
		index[id].set(data.slice(byte, byte + indexBytes), 1);
		byte += indexBytes;
	}

	// decode the huffman stream
	let output = [],
		outputlen = 0,
		id = "";
	for (const len = data.length; byte < len; byte++) {
		for (let i = 7; i >= 0; i--) {
			id += getBit(data[byte], i);
			if (index[id] !== undefined) {
				output.push(index[id]);
				outputlen += index[id].length;
				id = "";
			}
		}
	}

	// compile into byte stream
	const bytes = new Uint8ClampedArray(outputlen);
	output.reduce((offset, item) => {
		bytes.set(item, offset);
		return offset + item.length;
	}, 0);
	return bytes;
};
