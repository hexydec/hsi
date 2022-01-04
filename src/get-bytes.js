
// convert a string of bits into byte values
export default data => {
	const len = data.length,
		bytes = new Uint8ClampedArray(Math.ceil(len / 8));
	let byte = 0,
		bit = 7,
		n = 0;

	//
	for (let i = 0; i < len; i++) {
		byte = byte | data[i] << bit--;

		// create a byte
		if (bit < 0) {
			bytes[n++] = byte;
			bit = 7;
			byte = 0;
		}
	}

	// add extra byte if there is one
	if (bit < 7) {
		bytes[n] = byte;
	}
	return bytes;
};
