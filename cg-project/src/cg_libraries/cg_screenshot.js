
export function framebuffer_to_image_download(regl, buffer, name) {
	const image_array = regl.read({
		framebuffer: buffer,
	});

	name = name || 'screenshot.png';
	
	const {width, height} = buffer;

	const canvas_encoder = document.createElement('canvas');
	canvas_encoder.width = width;
	canvas_encoder.height = height;
	const canvas_encoder_context = canvas_encoder.getContext('2d');
	
	// float -> uint so multiply 255
	let scale = 255;

	// but perhaps we already get uints
	if (image_array instanceof Uint8Array) {
		scale = 1;
	}

	const image_array_uint8 = new Uint8ClampedArray(image_array.length);

	// convert the image to uint8 
	// + flip vertically (otherwise images come out flipped, I don't know why)
	for(let row = 0; row < height; row++) {
		const row_start_src = row*width*4;
		const row_start_dest = (height-row-1)*width*4;

		for(let col = 0; col < width*4; col++) {
			image_array_uint8[row_start_dest + col] = scale * image_array[row_start_src + col];
		}
	}

	// Copy the pixels to a 2D canvas
	const image_data = canvas_encoder_context.createImageData(width, height);
	image_data.data.set(image_array_uint8);
	canvas_encoder_context.putImageData(image_data, 0, 0);
	
	canvas_encoder.toBlob((img_data_encoded) => {
		const a = document.createElement('a');
		a.textContent = 'download';
		//document.body.appendChild(a);
		a.download = name;
		a.href = window.URL.createObjectURL(img_data_encoded);
		a.click();
	});
}
