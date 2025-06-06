attribute vec3 vertex_positions;
attribute vec3 vertex_normal;

// Varying values passed from the vertex shader
varying vec3 v2f_normal;
varying vec3 v2f_frag_pos;
varying vec3 v2f_light_position;
varying float v2f_height;

// Global variables specified in "uniforms" entry of the pipeline
uniform mat4 mat_model_view_projection;
uniform mat4 mat_model_view;
uniform mat3 mat_normals_model_view; // mat3 not 4, because normals are only rotated and not translated

uniform vec3 light_position; //in camera space coordinates already

void main()
{
    // the height of the terrain is its z coordinates
    v2f_height = vertex_positions.z;
    vec4 vertex_positions_v4 = vec4(vertex_positions, 1);
	
	// viewing vector (from camera to vertex in view coordinates), camera is at vec3(0, 0, 0) in cam coords
	// vertex position in camera coordinates
	v2f_frag_pos = (mat_model_view * vec4(vertex_positions_v4)).xyz;
	// transform normal to camera coordinates
	v2f_normal = normalize(mat_normals_model_view * vertex_normal);
    v2f_light_position = light_position;
	
	gl_Position = mat_model_view_projection * vertex_positions_v4;
}
