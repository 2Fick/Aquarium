import {vec3, vec4, mat3, mat4} from "../../lib/gl-matrix_3.3.0/esm/index.js"
// import {cg_mesh_make_cube} from "./cg_mesh.js"
import { TurntableCamera } from "../scene_resources/camera.js"
import { ResourceManager } from "../scene_resources/resource_manager.js"

/**
 * Captures the environment into a cubemap.
 */
export class EnvironmentCapture {
	
	visualization_color_factor = 1.0

	/**
	 * Captures the environment into a cubemap.
	 * @param {*} regl 
	 * @param {ResourceManager} resource_manager 
	 */
	constructor(regl, resource_manager) {
		this.resource_manager = resource_manager
		this.regl = regl

		this.env_cubemap = regl.framebufferCube({
			radius: 1024,
			colorFormat: 'rgba', // GLES 2.0 doesn't support single channel textures : (
			colorType: 'float',
		})
	
		const faces = [0, 1, 2, 3, 4, 5].map(side_idx => this.resource_manager.get_texture(`cube_side_${side_idx}.png`))

		this.annotation_cubemap = regl.cube(...faces)

		this.init_capture(regl)
		this.init_visualization(regl)
	}

	init_visualization(regl) {
		this.flattened_cubemap_pipeline = regl({
			attributes: {
				position: [
					[0., 0.],
					[3., 0.],
					[3., 2.],
					[0., 2.],
				],
			},
			elements: [
				[0, 1, 2], // top right
				[0, 2, 3], // bottom left
			],
			uniforms: {
				cubemap_to_show: this.env_cubemap,
				cubemap_annotation: this.annotation_cubemap,
				preview_rect_scale: ({viewportWidth, viewportHeight}) => {
					const aspect_ratio = viewportWidth / viewportHeight;
	
					const width_in_viewport_units = 0.8;
					const heigh_in_viewport_units = 0.4 * aspect_ratio;
	
					return [
						width_in_viewport_units / 3.,
						heigh_in_viewport_units / 2.,
					];
				},
				color_factor: () => this.visualization_color_factor,
			},
			vert: this.resource_manager.get_shader('cubemap_visualization.vert.glsl'),
			frag: this.resource_manager.get_shader('cubemap_visualization.frag.glsl'),
		})
	}

	/**
	 * Call this function to show the different side of the cube map on the screen
	 */
	visualize() {
		this.flattened_cubemap_pipeline()
	}

	init_capture(regl) {
		/*
			Cube_camera_projection:
			Construct the camera projection matrix which has a correct light camera's view frustum.
			It uses the function perspective, see https://stackoverflow.com/questions/28286057/trying-to-understand-the-math-behind-the-perspective-matrix-in-webgl
			Note: this is the same for all point lights/cube faces!
		*/
		this.cube_camera_projection = mat4.create()

		const fovy = Math.PI/2;
		const aspect = 1;
		const near = 0.1;
		const far = 200;
		mat4.perspective(this.cube_camera_projection, fovy, aspect, near, far);

		this.run_with_output_framebuffer = regl({
			framebuffer: regl.prop('out_buffer'),
		})
	}

	static CUBE_FACE_DIR = [
		[1,   0,  0], // +x
		[-1,  0,  0], // -x
		[0,   1,  0], // +y
		[0,  -1,  0], // -y
		[0,   0,  1], // +z
		[0,   0, -1], // -z
	]

	/*
		Construct the up vectors for the cube side cameras.
		These faces are indexed in the order: +x, -x, +y, -y, +z, -z.
		So when `side_idx = 0`, we should return the +x camera matrix,
		and when `side_idx = 5`, we should return the -z one.
	*/
	static CUBE_FACE_UP = [
		[0, -1, 0],
		[0, -1, 0],
		[0, 0, 1],
		[0, 0, -1],
		[0, -1, 0],
		[0, -1, 0],
	]

	cube_camera_view(side_idx, center, mat_view_camera) {
		
		const center_position_view = vec3.transformMat4([0., 0., 0.], center, mat_view_camera)

		const dir = this.constructor.CUBE_FACE_DIR[side_idx]
		const up = this.constructor.CUBE_FACE_UP[side_idx]

		const target = vec3.add(vec3.create(), center_position_view, dir);
		return mat4.multiply(mat4.create(), 
			mat4.lookAt(mat4.create(), center_position_view, target, up), 
			mat_view_camera,
		)
	}

	/**
	 * Render a cube map into this.env_cubemap
	 * @param {*} scene_state 
	 * @param {*} capture_center the position from which to render the cube map
	 * @param {*} scene_renderer_func the function to render the scene viewed from a face of the cube
	 */
	capture_scene_cubemap(scene_state, capture_center, scene_renderer_func) {
	
		const scene = scene_state.scene;

		// save the scene camera
		const scene_camera = scene.camera;

		// create a new camera object to which we set the projection matrix to 
		// be the one created earlier in this class
		const cube_camera = new TurntableCamera();
		cube_camera.mat.projection = this.cube_camera_projection;

		// override the scene camera with special camera for cube map rendering
		scene.camera = cube_camera;

		for(let side_idx = 0; side_idx < 6; side_idx ++) {
			const out_buffer = this.env_cubemap.faces[side_idx];

			// Set the view matrix for the cube camera
			cube_camera.mat.view = this.cube_camera_view(
				side_idx, capture_center, scene_camera.mat.view
			);
			// compute objects transformation matrices for this new camera
			cube_camera.compute_objects_transformation_matrices(scene.objects);
			
			// using REGL command nesting to run all the following commands
			// with the output framebuffer set to the current cubemap face
			this.run_with_output_framebuffer({
				out_buffer: out_buffer,
			}, () => {
				this.regl.clear({
					color: scene_state.background_color, // reset the canvas color to the same background color defined for the scene in main.js
					depth: 1,
				})

				scene_renderer_func(scene_state);
			});
		}

		// place back the initial camera
		scene.camera = scene_camera;
	}
}
