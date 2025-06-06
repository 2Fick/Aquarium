precision mediump float;

// Varying values passed from the vertex shader
varying vec3 v2f_frag_pos;
varying vec3 v2f_normal;
varying vec2 v2f_uv;

// Global variables specified in "uniforms" entry of the pipeline
uniform sampler2D material_texture;
uniform bool is_textured;
uniform vec3 material_base_color;
uniform float material_shininess;
uniform vec3 light_color;
uniform vec3 light_position;
uniform float ambient_factor;

void main()
{
    vec3 material_color = material_base_color;
    if (is_textured){
        vec4 frag_color_from_texture = texture2D(material_texture, v2f_uv);
        material_color = frag_color_from_texture.xyz;
    }

	float material_ambient = 0.6;

	// Blinn-Phong lighting model 
    vec3 v = normalize(-v2f_frag_pos);
    vec3 l = normalize(light_position - v2f_frag_pos);
    vec3 n = normalize(v2f_normal);
	vec3 h = normalize(l + v);

    float h_dot_n = clamp(dot(h, n), 1e-12, 1.);

    // Compute diffuse
    float diffuse = max(0.0, dot(n, l));

    // Compute specular
    float specular = (diffuse > 0.0) ? pow(h_dot_n, material_shininess) : 0.0;

    // Compute ambient
    vec3 ambient = ambient_factor * material_color * material_ambient;

    float light_distance = length(light_position - v2f_frag_pos);
    float attenuation = 1.0 / pow(light_distance, 0.25);

    // Compute pixel color
    vec3 color = ambient + (attenuation * light_color * material_color * (diffuse + specular));

	gl_FragColor = vec4(color, 1.);; // output: RGBA in 0..1 range
}
