// Vertex attributes, specified in the "attributes" entry of the pipeline
attribute vec3 vertex_positions;
attribute vec2 vertex_tex_coords;

// Per-vertex outputs passed on to the fragment shader
varying vec2 v2f_uv;

// Global variables specified in "uniforms" entry of the pipeline
uniform mat4 mat_model_view_projection;

void main() {
	v2f_uv = vertex_tex_coords;
	gl_Position = mat_model_view_projection * vec4(vertex_positions, 1);
}