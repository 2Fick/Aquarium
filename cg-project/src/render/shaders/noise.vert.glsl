attribute vec2 vertex_positions;

uniform vec2 viewer_position;
uniform float viewer_scale;

varying vec2 v2f_tex_coords;

void main() {
	vec2 local_coord = vertex_positions * viewer_scale;
	v2f_tex_coords = viewer_position + local_coord;

	gl_Position = vec4(vertex_positions, 0.0, 1.0);
}
