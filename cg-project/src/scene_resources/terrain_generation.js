
import {vec2, vec3, vec4, mat2, mat3, mat4} from "../../lib/gl-matrix_3.3.0/esm/index.js"

/**
 * Generate procedurally a terrain mesh using some procedural noise
 * @param {*} height_map a buffer texture that contains heigth values
 * @returns 
 */
export function terrain_build_mesh(height_map) {

	const grid_width = height_map.width;
	const grid_height = height_map.height;

	const vertices = [];
	const normals = [];
	const faces = [];

	// Map a 2D grid index (x, y) into a 1D index into the output vertex array.
	function xy_to_v_index(x, y) {
		return x + y*grid_width;
	}

	for(let gy = 0; gy < grid_height; gy++) {
		for(let gx = 0; gx < grid_width; gx++) {
			const idx = xy_to_v_index(gx, gy);
			let elevation = height_map.get(gx, gy) - 0.5; // we put the value between 0...1 so that it could be stored in a non-float texture on older browsers/GLES3, the -0.5 brings it back to -0.5 ... 0.5

			// normal as finite difference of the height map
			// dz/dx = (h(x+dx) - h(x-dx)) / (2 dx)
			normals[idx] = vec3.normalize([0, 0, 0], [
				-(height_map.get(gx+1, gy) - height_map.get(gx-1, gy)) / (2. / grid_width),
				-(height_map.get(gx, gy+1) - height_map.get(gx, gy-1)) / (2. / grid_height),
				1.,
			]);

			/*
			Generate the displaced terrain vertex corresponding to integer grid location (gx, gy). 
			The height (Z coordinate) of this vertex is determined by height_map.
			If the point falls below WATER_LEVEL:
			* it should be clamped back to WATER_LEVEL.
			* the normal should be [0, 0, 1]
	
			The XY coordinates are calculated so that the full grid covers the square [-0.5, 0.5]^2 in the XY plane.
			*/

			const vx = 1.0/grid_width * gx -0.5;
			const vy = 1.0/grid_height * gy -0.5;
			let vz = 0.;
			vz = elevation;
			vertices[idx] = [vx, vy, vz];
		}
	}

	for(let gy = 0; gy < grid_height - 1; gy++) {
		for(let gx = 0; gx < grid_width - 1; gx++) {
			/* 
			Triangulate the grid cell whose lower lefthand corner is grid index (gx, gy).
			You will need to create two triangles to fill each square.
			*/
			const va = xy_to_v_index(gx, gy);
			const vb = xy_to_v_index(gx+1, gy);
			const vc = xy_to_v_index(gx, gy+1);
			const vd = xy_to_v_index(gx+1, gy+1);

			faces.push([va, vb, vc]);
			faces.push([vb, vd, vc]);
			// faces.push([v1, v2, v3]) // adds a triangle on vertex indices v1, v2, v3
		}
	}

	return {
		vertex_positions: vertices,
		vertex_normals: normals,
		faces: faces,
        vertex_tex_coords: []
	}
}