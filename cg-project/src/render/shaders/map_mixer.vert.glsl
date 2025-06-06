// Vertex attributes, specified in the "attributes" entry of the pipeline
attribute vec3 vertex_positions;
attribute vec2 vertex_tex_coords;

// Varying values passed from the fragment shader
varying vec4 canvas_pos;

// Global variables specified in "uniforms" entry of the pipeline
uniform mat4 mat_model_view_projection;

void main() {
	gl_Position = mat_model_view_projection * vec4(vertex_positions, 1);
    canvas_pos = gl_Position;
}