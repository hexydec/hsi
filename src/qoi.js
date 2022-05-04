import encode from "./encoder.js";
import decode from "./decoder.js";

export default class qoi {

	encode(width, height, pixels, alpha, linearColorspace) {
		return encode(width, height, pixels, alpha, linearColorspace);
	}

	decode(qoi, size) {
		return decode(qoi, size);
	}

	load(canvas, uri, init) {
		fetch(uri, init)
			.then(response => response.blob())
			.then(blob => blob.arrayBuffer())
			.then(qoi => this.render(canvas, new Uint8ClampedArray(qoi)));
	}

	render(canvas, qoi) {
		const image = this.decode(qoi);
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
