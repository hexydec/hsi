import getBytes from "./get-bytes.js";
import getBit from "./get-bit.js";

const getSignificantBits = val => {
	const bin = [];
	let i = 7,
		found = false,
		bit = 0;
	while (i--) {
		if (found || (bit = getBit(val, i)) !== 0) {
			bin.push(bit);
			found = true;
		}
	}
	return bin;
};

// index the unique values noting their tree position and huffman code
const getIndex = (tree, code = [], index = [], n = 0) => {
	let data = {};
	for (let i = 0, len = tree.length; i < len; i++) {
		const val = tree[i].nodes === undefined ? 1 : 0;
		code.push(val);
		if (val) {
			tree[i].index = index.concat(i);
			tree[i].code = code.concat(tree[i].type);
			data[tree[i].key] = tree[i];
		} else {
			data = Object.assign(data, getIndex(tree[i].nodes, code, index.concat(i), i));
		}
		code = [];
	}
	return data;
};

// generate huffman code from the data
export default (data, cmdlen) => {
	const cache = {};
	let tree = [],
		t = 0,
		i = 0,
		len = data.length,
		bits = 1;

	// get the unique values from the data and count occurences
	console.time("Encoder: Create Tree");
	for (; i < len; i++) {

		// count the value
		const key = data[i].join(",");
		if (cache[key] === undefined) {

			// get commands bits
			const command = [];
			let c = cmdlen;
			while (c--) {
				command.push(getBit(data[i][0], c));
			}
			tree.push({
				count: 0,
				type: command, // make this bits
				data: data[i].slice(1),
				key: key
			});
			cache[key] = t++;

			// calculate the number of bits for the command
			// if (bits < command.length) {
			// 	bits = command.length;
			// }
		}
		tree[cache[key]].count++;
	}
	console.timeEnd("Encoder: Create Tree");

	// pad the command bits
	// tree.forEach(item => Array(bits - item.type.length).fill(0).push(...item.type));

	// build the tree
	console.time("Encoder: Order Tree");
	tree.sort((a, b) => a.count - b.count);
	len = tree.length;
	let start = 0;
	while (len > 2) {

		// chop off the lowest (top) two items
		const min = tree.splice(0, 2);
		const count = min.reduce((count, item) => count + item.count, 0),
			obj = {
				count: count,
				nodes: min
			};

		// splice into position, cut down the search by slicing the tree to the last pos
		if (!tree.slice(start).some((item, i) => {
			if (item.count >= count) {
				tree.splice(i, 0, obj);
				start += i;
				return true;
			}
		})) {

			// push onto the end
			tree.push(obj);
		}
		len--;
	}
	console.timeEnd("Encoder: Order Tree");

	// index the data
	console.time("Encoder: Index Tree");
	const index = getIndex(tree),
		keys = Object.keys(index);
	console.timeEnd("Encoder: Index Tree");

	// compile the bytecode
	console.time("Encoder: Compile Data Streams");
	const output = [

			// build the tree index
			getBytes(
				keys.reduce((arr, item) => {
					arr.push(...index[item].code);
					return arr;
				}, [])
			),

			// encode the data index
			new Uint8ClampedArray(
				keys.reduce((arr, item) => {
					arr.push(...index[item].data);
					return arr;
				}, [])
			),

			// build the huffman code
			getBytes(
				data.reduce((arr, item) => {
					arr.push(...index[item].index);
					return arr;
				}, [])
			)
		];
	console.timeEnd("Encoder: Compile Data Streams");

	// add the bytes
	console.time("Encoder: Compile Bytecode");
	const bytes = new Uint8ClampedArray(output.reduce((size, item) => size + item.length, 0));
	output.reduce((offset, item) => {
		bytes.set(item, offset);
		return offset + item.length;
	}, 0);
	console.timeEnd("Encoder: Compile Bytecode");
	return bytes;
}
