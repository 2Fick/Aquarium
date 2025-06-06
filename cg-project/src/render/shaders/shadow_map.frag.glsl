precision highp float;

// Varying values passed from the vertex shader
varying vec3 v2f_frag_pos;

void main () {
	float depth = length(v2f_frag_pos); // in view coordinates, the camera is at [0, 0, 0]
	gl_FragColor = vec4(depth, depth, depth, 1.);
}