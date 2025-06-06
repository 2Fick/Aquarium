precision mediump float;

varying vec3 vertex_to_fragment_normal;

void main() {
    vec3 color = 0.5 * normalize(vertex_to_fragment_normal) + 0.5;
    gl_FragColor = vec4(color, 1.0);
}
