
attribute vec3 vertex_positions;

// Varying values passed to the fragment shader
varying vec3 v2f_frag_pos;

uniform mat4 mat_model_view_projection;
uniform mat4 mat_model_view;

void main() {
	vec4 position_v4 = vec4(vertex_positions, 1);
  
	v2f_frag_pos = (mat_model_view * position_v4).xyz;
	gl_Position = mat_model_view_projection * position_v4;

}
