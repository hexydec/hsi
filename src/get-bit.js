export default (byte, bit) => {
	const bitmask = 1 << bit,
		left = byte & bitmask;
	return left >>> bit;
};
