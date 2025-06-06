// Vertex attributes, specified in the "attributes" entry of the pipeline
attribute vec3 vertex_positions;

varying vec3 world_position_frag;
varying vec3 normal;

// Global variables specified in "uniforms" entry of the pipeline
uniform mat4 mat_model_view_projection;
uniform mat4 mat_model_to_world;
uniform mat3 mat_normals_model_view;

void main() {
	world_position_frag = (mat_model_to_world * vec4(vertex_positions, 1)).xyz;

	normal = normalize(mat_normals_model_view * vertex_positions);
	gl_Position = mat_model_view_projection * vec4(vertex_positions, 1);
}