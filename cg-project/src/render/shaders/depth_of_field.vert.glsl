// Vertex attributes, specified in the "attributes" entry of the pipeline
attribute vec3 vertex_positions;

// Varying values passed from the fragment shader
varying vec4 canvas_pos;

// Global variables specified in "uniforms" entry of the pipeline
uniform mat4 mat_model_view_projection;
uniform mat4 mat_model_view;

varying float cam_depth;

void main() {
	// Calculate the depth of the vertex in camera space
	cam_depth = length(mat_model_view * vec4(vertex_positions, 1));

	// We just need the position of the vertex in clip space for the canvas position
	gl_Position = mat_model_view_projection * vec4(vertex_positions, 1);
	canvas_pos = gl_Position;
}