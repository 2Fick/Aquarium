attribute vec3 vertex_position;
attribute vec3 vertex_normal;

varying vec3 vertex_to_fragment_normal;

uniform mat4 mat_mvp;
uniform mat3 mat_normals_to_view;

void main() {
    // Transform normal to view space
    vertex_to_fragment_normal = normalize(mat_normals_to_view * vertex_normal);

    // Project the vertex position
    gl_Position = mat_mvp * vec4(vertex_position, 1.0);
}
