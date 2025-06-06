precision highp float;

varying float v2f_height;

// Varying values passed to fragment shader
varying vec3 v2f_normal;
varying vec3 v2f_frag_pos;
varying vec3 v2f_light_position;

// Global variables specified in "uniforms" entry of the pipeline
uniform vec3  light_color;
uniform vec3  sand_color;
uniform float  sand_shininess;

uniform vec3 deep_water_color;
uniform float deep_water_shininess;

uniform float ambient_factor;

uniform float blendWidth;

// Small perturbation to prevent "z-fighting" on the water on some machines...
const float deep_water_level = -0.03125 + 1e-6;




void main()
{
	float material_ambient = 0.1; // Ambient light coefficient
	float height = v2f_height;
	vec3 light_position = v2f_light_position;

	vec3 material_color = sand_color;
	float shininess = sand_shininess;

	// how tall (in height units) your blend band is:
    //const float blendWidth = 0.20;

    if (height > deep_water_level + blendWidth) {
        // fully sand: no gradient at all
        material_color = sand_color;
        shininess     = sand_shininess;
    }
    else if (height < deep_water_level - blendWidth) {
        // fully deep water
        material_color = deep_water_color;
        shininess     = deep_water_shininess;
    }
    else {
        // in the narrow band around deep_water_level, blend
        // t=0 at (h = deep_water_level - blendWidth)
        // t=1 at (h = deep_water_level + blendWidth)
        float t = smoothstep(
            deep_water_level - blendWidth,
            deep_water_level + blendWidth,
            height
        );
        material_color = mix(deep_water_color, sand_color, t);
        shininess     = mix(deep_water_shininess, sand_shininess, t);
    }

	// Blinn-Phong lighting model
	vec3 v = normalize(-v2f_frag_pos);
	vec3 l = normalize(light_position - v2f_frag_pos);
	vec3 n = normalize(v2f_normal);
	float dist_frag_light = length(v2f_frag_pos - light_position);

	vec3 h = normalize(l + v);

    // Compute diffuse
    vec3 diffuse = vec3(0.0);
	diffuse = material_color * max(dot(n, l), 0.0);
	
	// Compute specular
    vec3 specular = vec3(0.0);
	float s = dot(h, n);
	if (s > 0.0){
		specular = material_color * pow(s, shininess);
	}

	// Compute ambient
	vec3 ambient = ambient_factor * material_color * material_ambient;

	//float attenuation = 1. / (dist_frag_light * dist_frag_light);
	
	// Compute pixel color
    vec3 color = ambient + (light_color * (diffuse + specular));
	gl_FragColor = vec4(color, 1.); // output: RGBA in 0..1 range
}