import encode from "./image-encoder.js";
import decode from "./image-decoder.js";

export default class hsi {

	encode(width, height, pixels, alpha, linearColorspace) {
		return encode(width, height, pixels, alpha, linearColorspace);
	}

	decode(hsi, size) {
		return decode(hsi, size);
	}

	load(canvas, uri, init) {
		fetch(uri, init)
			.then(response => response.blob())
			.then(blob => blob.arrayBuffer())
			.then(hsi => this.render(canvas, new Uint8ClampedArray(hsi)));
	}

	render(canvas, hsi) {
		const image = this.decode(hsi);
		console.log(image);
		if (image !== false) {
			canvas.width = image.width;
			canvas.height = image.height;
			const ctx = canvas.getContext("2d"),
				imageData = new ImageData(image.data, image.width);
			ctx.putImageData(imageData, 0, 0);
		}
	}
}
