import hsi from "./src/hsi.js";
import encode from "./src/image-encoder.js";
import decode from "./src/image-decoder.js";

document.addEventListener("readystatechange", e => {
	if (e.target.readyState === "complete") {
		// document.querySelector(".hsi__file").addEventListener("change", e => {
		// 	const value = e.target.files[0];
		// 	console.log(value);
		// 	if (value) {
		// 		const obj = new hsi();
		// 		obj.load(document.querySelector("canvas"), value);
		// 	}
		// });

		// load image
		const canvas = document.querySelector(".hsi__input"),
			context = canvas.getContext("2d"),
			image = new Image();

		image.onload = () => {
			canvas.width = image.width;
			canvas.height = image.height;
			context.drawImage(image, 0, 0);

			// encode the image
			const data = context.getImageData(0, 0, image.width, image.height);
			console.time("Encode Image");
			const encoded = encode(data.width, data.height, data.data);
			console.timeEnd("Encode Image");
			console.time("Decode Image");
			const decoded = decode(encoded);
			console.timeEnd("Decode Image");

			// display the decoded image
			const output = document.querySelector(".hsi__output"),
				ctx = output.getContext("2d"),
				imageData = new ImageData(decoded.data, decoded.width, decoded.height);
			output.width = decoded.width;
			output.height = decoded.height;
			ctx.putImageData(imageData, 0, 0);

		};
		image.src = "images/dice.png";
	}
});
