precision mediump float;

varying vec2 v2f_position;

uniform samplerCube cubemap_to_show;
uniform samplerCube cubemap_annotation;
uniform float color_factor;

const float margin = 0.01;
const vec3 margin_color = vec3(0.03, 0.75, 0.35);
const vec3 arrow_color = vec3(0.91, 0.58, 0.08);
const vec3 text_color = vec3(0.91, 0.28, 0.08);


void main () {

	vec2 grid_cell = floor(v2f_position);
	vec2 pos_within_grid = v2f_position - grid_cell; // same as fract(v2f_position)

	float direction_switch = grid_cell.y >= 1. ? 1. : -1.;
	vec2 tex_coord = 2. * (pos_within_grid - 0.5);

	vec3 point_to_sample;

	if (grid_cell.x == 0.) {
		point_to_sample = vec3(direction_switch, tex_coord.y, tex_coord.x * (-direction_switch));
	} else if (grid_cell.x == 1.) {
		point_to_sample = vec3(tex_coord.x, direction_switch, tex_coord.y * (-direction_switch));
	} else {
		point_to_sample = vec3(tex_coord.x * (direction_switch), tex_coord.y, direction_switch);
	}

	vec4 cubemap_value = textureCube(cubemap_to_show, point_to_sample);
	vec4 annotation_value = textureCube(cubemap_annotation, point_to_sample);

	// gl_FragColor = vec4(vec3(cubemap_value.r * 0.1), 1.0);
	gl_FragColor = vec4(cubemap_value.rgb * color_factor, 1.0);


	if (pos_within_grid.x < margin || pos_within_grid.x > (1.-margin) 
		||
		pos_within_grid.y < margin || pos_within_grid.y > (1.-margin)
	) {
		gl_FragColor.rgb = margin_color;
	}

	float annotation_opacity = min(1., annotation_value.r + annotation_value.g);
	vec3 annotation_color = annotation_value.r * arrow_color + annotation_value.g * text_color;

	gl_FragColor.rgb = mix(gl_FragColor.rgb, annotation_color, annotation_opacity);
}
