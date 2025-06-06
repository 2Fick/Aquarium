precision mediump float;
		
// Texture coordinates passed from vertex shader
varying vec2 v2f_uv;

// Global variables specified in "uniforms" entry of the pipeline
uniform sampler2D material_texture; // Texture to sample color from
uniform bool is_textured;
uniform vec3 material_base_color;

void main()
{
    vec3 material_color = material_base_color;

    // check wether the color to display is a base color or comes from a texture
    if (is_textured){
        vec4 frag_color_from_texture = texture2D(material_texture, v2f_uv);
        material_color = frag_color_from_texture.xyz;
    }

	gl_FragColor = vec4(material_color, 1.); // output: RGBA in 0..1 range
}