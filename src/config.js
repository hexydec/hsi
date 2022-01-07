export default {
	magic: [104, 115, 105, 102], // hsif
	commands: [ // the byte lengths for each command
		3, // HSI_OP_RGB
		4, // HSI_OP_RGBA
		1 // HSI_OP_INDEX
	]
};
