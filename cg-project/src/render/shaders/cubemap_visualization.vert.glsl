/*
Mesh is from [0, 0] to [3, 2]
*/
attribute vec2 position;

varying vec2 v2f_position;

uniform vec2 preview_rect_scale;

void main() {
	v2f_position = position;
	// subtract [1, 1] to be in the bottom-left corner
	gl_Position = vec4(position * preview_rect_scale - vec2(1., 1.), -0.98, 1);
}
