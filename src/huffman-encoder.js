import getBytes from "./get-bytes.js";

// index the unique values noting their tree position and huffman code
const getIndex = (tree, code = [], index = [], n = 0) => {
	let data = {};
	for (let i = 0, len = tree.length; i < len; i++) {
		const val = tree[i].nodes === undefined ? 1 : 0;
		code.push(val);
		if (val) {
			tree[i].index = index.concat(i);
			tree[i].code = code.concat(tree[i].type); // this is still a problem - needs to be bits
			data[tree[i].key] = tree[i];
		} else {
			data = Object.assign(data, getIndex(tree[i].nodes, code, index.concat(i), i));
		}
		code = [];
	}
	return data;
},

toBinString = bytes => bytes.reduce((str, byte) => str + byte.toString(2).padStart(8, "0"), "");

// generate huffman code from the data
export default data => {
	const cache = {};
	let tree = [],
		t = 0,
		i = 0,
		len = data.length,
		bits = 1;

	// get the unique values from the data and count occurences
	console.time("Create Tree");
	for (; i < len; i++) {

		// count the value
		const key = data[i];
		if (cache[key] === undefined) {
			tree.push({
				count: 0,
				type: data[i][0],
				data: data[i].slice(1),
				key: key
			});
			cache[key] = t++;
			const b = Math.ceil(Math.log2(tree[cache[key]].type));
			if (bits < b) {
				bits = b;
			}
		}
		tree[cache[key]].count++;
	}
	console.timeEnd("Create Tree");

	// build the tree
	console.time("Order Tree");
	tree.sort((a, b) => a.count - b.count);
	len = tree.length;
	while (len > 2) {

		// chop off the lowest (top) two items
		const min = tree.splice(0, 2);
		const count = min.reduce((count, item) => count + item.count, 0),
			obj = {
				count: count,
				nodes: min
			};

		// splice into position
		if (tree.every((item, i) => {
			if (item.count >= count) {
				tree.splice(i, 0, obj);
				return false;
			}
			return true;
		})) {

			// push onto the end
			tree.push(obj);
		}
		len--;
	}
	console.timeEnd("Order Tree");

	// index the data
	console.time("Index Tree");
	const index = getIndex(tree),
		keys = Object.keys(index);
	console.timeEnd("Index Tree");

	// compile the bytecode
	console.time("Compile Data Streams");
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
	console.timeEnd("Compile Data Streams");

	// add the bytes
	console.time("Compile Bytecode");
	const bytes = new Uint8ClampedArray(output.reduce((size, item) => size + item.length, 0));
	output.reduce((offset, item) => {
		bytes.set(item, offset);
		return offset + item.length;
	}, 0);
	console.timeEnd("Compile Bytecode");
	return bytes;
}
