import getBytes from "./get-bytes.js";

// get the min occurences from each value in the data
const getMin = data => {
	let min = null,
		i = 0,
		len = data.length;
	for (; i < len; i++) {
		if (min === null || data[min].count > data[i].count) {
			min = i;
		}
	}
	return min;
},

// index the unique values noting their tree position and huffman code
getIndex = (tree, code = [], index = [], n = 0) => {
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

	// build the tree
	while (tree.length > 2) {
		const min1 = getMin(tree),
			value1 = tree[min1];
		tree.splice(min1, 1);
		const min2 = getMin(tree),
			value2 = tree[min2];
		tree.splice(min2, 1);
		tree.push({
			count: value1.count + value2.count,
			nodes: [value1, value2]
		});
	}

	// index the data
	const index = getIndex(tree),
		keys = Object.keys(index),
		output = [

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

	// add the bytes
	const bytes = new Uint8ClampedArray(output.reduce((size, item) => size + item.length, 0));
	output.reduce((offset, item) => {
		bytes.set(item, offset);
		return offset + item.length;
	}, 0);
	return bytes;
}
