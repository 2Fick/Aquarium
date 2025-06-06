
import { NoiseShaderRenderer } from "./shader_renderers/noise_sr.js";
import { BufferToScreenShaderRenderer } from "./shader_renderers/buffer_to_screen_sr.js";

import { vec2 } from "../../lib/gl-matrix_3.3.0/esm/index.js";


export class ProceduralTextureGenerator {

    /**
     * A class that allow procedural texture computation 
     * @param {*} regl 
     * @param {*} resource_manager 
     */
    constructor(regl, resource_manager){

        this.regl = regl;
        this.resource_manager = resource_manager;

        // A simple square mesh used to draw texture on it
        this.mesh_quad_2d = this.create_mesh_quad();   
        // A noise buffer used to store the content that needs to be displayed on screen
        this.noise_buffer = this.new_buffer();

        // The shader that generates the noise
        this.noise = new NoiseShaderRenderer(regl, resource_manager);
        // The shader that can display the content of a buffer of the screen
        this.buffer_to_screen = new BufferToScreenShaderRenderer(regl, resource_manager);
    }

    /**
     * Create a new buffer in which to draw the result of the render
     * @returns 
     */
    new_buffer(){

        // Safari (at least older versions of it) does not support reading float buffers
        let isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        // Shared buffer to which the texture are rendered
        const buffer = this.regl.framebuffer({
            width: 768,
            height: 768,
            colorFormat: 'rgba',
            colorType: isSafari ? 'uint8' : 'float',
            stencil: false,
            depth: false,
            mag: 'linear',
            min: 'linear', 
        })

        return buffer;
    }

    /**
     * Generate a new procedural texture
     * @param {*} name the name associated to the texture resource
     * @param {*} function_type the name of the noise function, see the ones defined in noise_sr.js.
     * @param {*} param {mouse_offset, zoom_factor, width, height} 
     * optional additional parameters to parametrize the computation of the noise
     * @returns 
     */
    compute_texture(name, function_type, {mouse_offset = [0, 0], zoom_factor = 1.0, width = 256, height = 256,
        border = 0.3,
        fb_perlin_multiplier = 0.5,
        fb_perlin_offset = 0.5,
        fb_feature_perlin_argument_multiplier = 30.0,
        fb_feature_exponent = 1.2,
        fb_feature_perlin_multiplier = 0.1,
        comp_perlin_multiplier = 0.5,
        comp_perlin_offset = 0.5,
        comp_flat_exponent = 0.7,
        comp_sharp_exponent = 0.5,
        comp_ctrl_scaleA = 0.5,
        comp_ctrl_scaleB = 1.2,
        comp_ctrl_weightA = 0.6,
        comp_steps = 8.0,
    }){
        // Create a new buffer in which we will generate the texture
        const buffer = this.new_buffer();
        if (buffer.width != width || buffer.height != height) {
            buffer.resize(width, height)
        }

        // Render the texture in the buffer
        this.noise.render(
            this.mesh_quad_2d,
            buffer, 
            function_type, 
            zoom_factor,
            vec2.negate([0, 0], mouse_offset),
            // additional parameters for the sand noise
            border = border,
            fb_perlin_multiplier = fb_perlin_multiplier,
            fb_perlin_offset = fb_perlin_offset,
            fb_feature_perlin_argument_multiplier = fb_feature_perlin_argument_multiplier,
            fb_feature_exponent = fb_feature_exponent,
            fb_feature_perlin_multiplier = fb_feature_perlin_multiplier,
            comp_perlin_multiplier = comp_perlin_multiplier,
            comp_perlin_offset = comp_perlin_offset,
            comp_flat_exponent = comp_flat_exponent,
            comp_sharp_exponent = comp_sharp_exponent,
            comp_ctrl_scaleA = comp_ctrl_scaleA,
            comp_ctrl_scaleB = comp_ctrl_scaleB,
            comp_ctrl_weightA = comp_ctrl_weightA,
            comp_steps = comp_steps,
        )


        // Convert the buffer to an array of float data that can be queried
        const texture = buffer_to_data_array(this.regl, buffer)
        this.resource_manager.resources[name] = texture;
        return texture;
    }

    /**
     * Display the result of the desired noise function on the canvas
     * @param {*} function_type the name of the noise function, see the ones defined in noise_sr.js.
     * @param {*} param {mouse_offset, zoom_factor, width, height} 
     * optional additional parameters to parametrize the computation of the noise 
     */
    display_texture(function_type, {mouse_offset = [0, 0], zoom_factor = 1.0, width = 256, height = 256}){

        // Render the texture in the buffer
        const buffer = this.noise_buffer;
        if (buffer.width != width || buffer.height != height) {
            buffer.resize(width, height)
        }
        
        this.noise.render(
            this.mesh_quad_2d,
            buffer, 
            function_type, 
            zoom_factor,
            vec2.negate([0, 0], mouse_offset),
        )

        // Display
        this.buffer_to_screen.render(this.mesh_quad_2d, buffer);
    }

    /**
     * Create the simple square mesh on which the texture is displayed
     * @returns 
     */
    create_mesh_quad(){
        return {
            vertex_positions: [
                // 4 vertices with 2 coordinates each
                [-1, -1],
                [1, -1],
                [1, 1],
                [-1, 1],
            ],
            faces: [
                [0, 1, 2], // top right
                [0, 2, 3], // bottom left
            ],
        };
    }

}

/**
 * Helper function to convert a regl buffer content to a data array
 * that can be queried for values at specific coordinates.
 * @param {*} regl 
 * @param {*} buffer 
 * @returns 
 */
export function buffer_to_data_array(regl, buffer){
    return new BufferData(regl, buffer);
} 

/**
 * Helper class to convert a regl buffer to a data array 
 * that can be queried for values at specific coordinates.
 */
class BufferData {

	constructor(regl, buffer) {
		this.width = buffer.width
		this.height = buffer.height
		this.data = regl.read({framebuffer: buffer})

		// this can read both float and uint8 buffers
		if (this.data instanceof Uint8Array) {
			// uint8 array is in range 0...255
			this.scale = 1./255.
		} else {
			this.scale = 1.
		}

	}

	get(x, y) {
		x = Math.min(Math.max(x, 0), this.width - 1)
		y = Math.min(Math.max(y, 0), this.height - 1)

		return this.data[x + y*this.width << 2] * this.scale
	}
}

