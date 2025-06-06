/*---------------------------------------------------------------
	Functions related to the web platform
	
		- waiting for document initialization
		- texture loading
		- keyboard bidings
		- input element creation
---------------------------------------------------------------*/


/** 
* This promise gets resolved when the document has loaded
* loading - https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event
* what is a promise - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
*/
export const DOM_loaded_promise = new Promise((accept, reject) => {
	if (document.readyState === 'loading') {  // Loading hasn't finished yet
		 document.addEventListener('DOMContentLoaded', accept);
	} else {  // `DOMContentLoaded` has already fired
		accept();
	}
}); 

export function async_timeout(time_s) {
	return new Promise(resolve => setTimeout(resolve, time_s*1000));
}

/*
Downloads an image from an URL
*/
export function load_image(img_url) {
	return new Promise((resolve, reject) => {
		const img_obj = new Image;
		img_obj.crossOrigin = "anonymous";
		img_obj.addEventListener('load', (ev) => resolve(ev.target));
		img_obj.addEventListener('error', (ev) => {
			console.error(`Failed to load image ${img_url}, maybe due to CORS. img.onerror returned`, ev);
			reject(ev);
		});
		img_obj.src = img_url;
	});
}

/*
Downloads an image and converts it to a WebGL texture.
We need to provide the regl instance which communicates with the GPU to put the texture in GPU memory.
	tex_options = override construction options
		https://github.com/regl-project/regl/blob/master/API.md#textures
*/
export async function load_texture(regl_instance, img_url, tex_options) {
	const img = await load_image(img_url);

	return regl_instance.texture(Object.assign({
		data: img,
		// When sampling the texture, use linear interpolation not just the nearest pixel
		mag: 'linear',
		min: 'linear', 
	}, tex_options))
}

export async function load_text(url) {
	try {
		const response = await fetch(url);
		const response_text = await response.text();
		return response_text;
	} catch (e) {
		console.error('Failed to load text resource from', url, 'error:', e);
		throw e;
	}
}

/**
 * Key-bindings
 * keyboard_actions holds functions to be called when keys are pressed.
 * keyboard_actions['a'] = function_to_call_on_A_key
*/
const keyboard_actions = {};

DOM_loaded_promise.then(() => {
	document.addEventListener('keydown', (event) => {
		// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
		// Shift affects the key string, shift+a yields A
		// Alt+letter yields locale specific characters, alt+a = ą etc
		const key = event.key.toLowerCase();

		/*
		const modifiers = [];
		
		if(event.ctrlKey) {
			modifiers.push('Ctrl');
		}

		if(event.altKey) {
			modifiers.push('Ctrl');
		}

		if(event.shiftKey) {
			modifiers.push('Shift');
		}

		if(event.metaKey) {
			modifiers.push('Super')
		}

		console.log('keyboard', `${modifiers.join('+')} ${key}`);
		*/

		const handlers = keyboard_actions[key];

		if(handlers) {
			handlers.forEach(f => f(event));
		}
	});
})

function register_keyboard_action(key, func) {
	key = key.toLowerCase();
	const handlers = keyboard_actions[key] || [];
	keyboard_actions[key] = handlers;
	handlers.push(func);
}

// Get the html element in which inputs should be added
const overlay = document.getElementById('overlay');

/**
 * Remove every elements inside the overlay
 */
export function clear_overlay(){
	overlay.replaceChildren();
}

/**
 * Hide / unhide the overlay
 */
export function toggle_overlay_visibility(){
	overlay.classList.toggle('hide');
}

/*---------------------------------------------------------------
	Functions to create new interface elements
---------------------------------------------------------------*/

/**
 * Create a new slider
 * @param {String} title the display title near the slider
 * @param {*} range the range of the sliders [min, max]
 * @param {(Int) => {}} action action(new_value) the function to execute when the value of the slider changes
 */
export function create_slider(title, range, action){
    // Creates the html elements
	const slider_block = document.createElement("div");
    const slider = document.createElement("input");
    const slider_text = document.createElement("span");

	// Set some values of these elements
	slider.className = "slider";
    slider.type = "range";
    slider.min = range[0];
    slider.max = range[1];
    slider.value = range[0]; // set default value to the min value
    slider_text.textContent = title;

	// Define the action executed when the input changes (when dragging the slider)
    slider.oninput = () => {
            action(slider.value);
    }

	// Add the html elements to the hierarchy
    slider_block.appendChild(slider_text);
    slider_block.appendChild(slider);
    overlay.appendChild(slider_block);
}

/**
 * Create a block to display the hotkey actions and bind the desired keyboard key to the action
 * @param {String} title the display text on the overlay - describe what this key does
 * @param {*} key the keyboard key to bind (ex : "a")
 * @param {() => {}} action a function to execute when the key is pressed
 */
export function create_hotkey_action(title, key, action){
	const instruction = document.createElement("p");
	instruction.textContent = `${title}`;

	const hotkey = document.createElement("span");
	hotkey.textContent = key;
	hotkey.className = "hotkey";

	instruction.appendChild(hotkey);
	overlay.appendChild(instruction);
	register_keyboard_action(key, () => action());
}


/**
 * Create a button on the overlay that trigger an action uppon clicking
 * @param {String} title the text display on the button
 * @param {() => {}} action the function to execute when the button is pressed
 */
export function create_button(title, action){
    const button_block = document.createElement("div");
    const button = document.createElement("button");
    button.textContent = title;

    button.onclick = () => {
        action();
    }

    button_block.appendChild(button);
    overlay.appendChild(button_block);
	return button_block;
}

/**
 * Create a button and bind a hotkey to excute an action when the button or the hotkey is pressed
 * @param {String} title the text displayed on the button
 * @param {*} key the key to bind (ex: "v")
 * @param {() => {}} action the function to execute when the button or the hotkey is pressed
 */
export function create_button_with_hotkey(title, key, action){
    const button_block = create_button(title, action);

	const hotkey = document.createElement("span");
	hotkey.textContent = key;
	hotkey.className = "hotkey";
	button_block.appendChild(hotkey);

    register_keyboard_action(key, () => action());
}

/**
 * Create a form in the UI to input two values (x & y) with a submit button
 * @param {String} title the text to display next to the inputs
 * @param {([Int, Int]) => {}} action the action to execute when the submit button is pressed
 */
export function create_offset_form(title, action) {
	// Create new html elements for the form
	const form = document.createElement("form");
	const inputX = document.createElement("input");
	const inputY = document.createElement("input");
	const submit = document.createElement("input");
  
	inputX.className = "terrainOffset";
	inputX.type = "number";
	inputX.id = "terrainOffsetX";
	inputX.min = -1000;
	inputX.max = 1000;
	inputX.value = 0;
  
	inputY.className = "terrainOffset";
	inputY.type = "number";
	inputY.id = "terrainOffsetY";
	inputY.min = -1000;
	inputY.max = 1000;
	inputY.value = 0;
  
	submit.type = "submit";
	submit.id = "submitOffset";
	submit.value = title;
  
	// Overwrite button default behaviour to instead call our action function 
	// without a reload of the page
	submit.onclick = (event) => {
	  event.preventDefault();
	  action([
		inputX.value,
		inputY.value,
	  ]);
	};
  
	// Add the element to the hierarchy
	form.appendChild(submit);
	form.appendChild(inputX);
	form.appendChild(inputY);
	overlay.appendChild(form);
  }
