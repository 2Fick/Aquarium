// this version is needed for: indexing an array, const array, modulo %
precision highp float;

//=============================================================================
//	Exercise code for "Introduction to Computer Graphics 2018"
//     by
//	Krzysztof Lis @ EPFL
//=============================================================================

#define NUM_GRADIENTS 12

// -- Gradient table --
vec2 gradients(int i) {
	if (i ==  0) return vec2( 1,  1);
	if (i ==  1) return vec2(-1,  1);
	if (i ==  2) return vec2( 1, -1);
	if (i ==  3) return vec2(-1, -1);
	if (i ==  4) return vec2( 1,  0);
	if (i ==  5) return vec2(-1,  0);
	if (i ==  6) return vec2( 1,  0);
	if (i ==  7) return vec2(-1,  0);
	if (i ==  8) return vec2( 0,  1);
	if (i ==  9) return vec2( 0, -1);
	if (i == 10) return vec2( 0,  1);
	if (i == 11) return vec2( 0, -1);
	return vec2(0, 0);
}

float hash_poly(float x) {
	return mod(((x*34.0)+1.0)*x, 289.0);
}

// -- Hash function --
// Map a gridpoint to 0..(NUM_GRADIENTS - 1)
int hash_func(vec2 grid_point) {
	return int(mod(hash_poly(hash_poly(grid_point.x) + grid_point.y), float(NUM_GRADIENTS)));
}

// -- Smooth interpolation polynomial --
// Use mix(a, b, blending_weight_poly(t))
float blending_weight_poly(float t) {
	return t*t*t*(t*(t*6.0 - 15.0)+10.0);
}


// Constants for FBM
const float freq_multiplier = 2.17;
const float ampl_multiplier = 0.5;
const int num_octaves = 6;

// ==============================================================
// 1D Perlin noise evaluation and plotting

float perlin_noise_1d(float x) {
	/*
	Note Gradients gradients(i) from in the table are 2d, so in the 1D case we use grad.x
	*/

	/*
	Evaluate the 1D Perlin noise function at "x" as described in the handout. 
	You will determine the two grid points surrounding x, 
	look up their gradients, 
	evaluate the the linear functions these gradients describe, 
	and interpolate these values 
	using the smooth interolation polygnomial blending_weight_poly.
	*/

	float LC = floor(x);
	float RC = LC + 1.;

	int hashL = hash_func(vec2(LC, 0.));
	int hashR = hash_func(vec2(RC, 0.));

	float GRADL = gradients(hashL).x;
	float GRADR = gradients(hashR).x;

	float funcL = GRADL * (x - LC);
	float funcR = GRADR * (x - RC);

	float t = x - LC;

	float a = blending_weight_poly(t);
	float result = mix(funcL, funcR, a);

	return result;
}

float perlin_fbm_1d(float x) {
	/*
	Implement 1D fractional Brownian motion (fBm) as described in the handout.
	You should add together num_octaves octaves of Perlin noise, starting at octave 0. 
	You also should use the frequency and amplitude multipliers:
	freq_multiplier and ampl_multiplier defined above to rescale each successive octave.
	
	Note: the GLSL `for` loop may be useful.
	*/

	float freq = 1.;
	float ampl = 1.;

	float p = 0.;

	for (int i = 0; i < num_octaves; i++){
		p += ampl * perlin_noise_1d(freq * x);
		freq *= freq_multiplier;
		ampl *= ampl_multiplier;
	}

	return p;
}

// ----- plotting -----

const vec3 plot_foreground = vec3(0.5, 0.8, 0.5);
const vec3 plot_background = vec3(0.2, 0.2, 0.2);

vec3 plot_value(float func_value, float coord_within_plot) {
	return (func_value < ((coord_within_plot - 0.5)*2.0)) ? plot_foreground : plot_background;
}

vec3 plots(vec2 point) {
	// Press D (or right arrow) to scroll

	// fit into -1...1
	point += vec2(1., 1.);
	point *= 0.5;

	if(point.y < 0. || point.y > 1.) {
		return vec3(255, 0, 0);
	}

	float y_inv = 1. - point.y;
	float y_rel = y_inv / 0.2;
	int which_plot = int(floor(y_rel));
	float coord_within_plot = fract(y_rel);

	vec3 result;
	if(which_plot < 4) {
		result = plot_value(
 			perlin_noise_1d(point.x * pow(freq_multiplier, float(which_plot))),
			coord_within_plot
		);
	} else {
		result = plot_value(
			perlin_fbm_1d(point.x) * 1.5,
			coord_within_plot
		);
	}

	return result;
}

// ==============================================================
// 2D Perlin noise evaluation


float perlin_noise(vec2 point) {
	/*
	Implement 2D perlin noise as described in the handout.
	You may find a glsl `for` loop useful here, but it's not necessary.
	*/

	vec2 c_s = vec2(floor(point.x), floor(point.y));
	vec2 c_t = vec2(c_s.x + 1., c_s.y);
	vec2 c_u = vec2(c_s.x, c_s.y + 1.);
	vec2 c_v = vec2(c_s.x + 1., c_s.y + 1.);

	int h_s = hash_func(c_s);
	int h_t = hash_func(c_t);
	int h_u = hash_func(c_u);
	int h_v = hash_func(c_v);

	vec2 g_s = gradients(h_s);
	vec2 g_t = gradients(h_t);
	vec2 g_u = gradients(h_u);
	vec2 g_v = gradients(h_v);

	vec2 a = point - c_s;
	vec2 b = point - c_t;
	vec2 c = point - c_u;
	vec2 d = point - c_v;

	float s = dot(g_s, a);
	float t = dot(g_t, b);
	float u = dot(g_u, c);
	float v = dot(g_v, d);

	float st = mix(s, t, blending_weight_poly(a.x));
	float uv = mix(u, v, blending_weight_poly(c.x));

	float result = mix(st, uv, blending_weight_poly(a.y));

	return result;
}

vec3 tex_perlin(vec2 point) {
	// Visualize noise as a vec3 color
	float freq = 23.15;
 	float noise_val = perlin_noise(point * freq) + 0.5;
	return vec3(noise_val);
}

// ==============================================================
// 2D Fractional Brownian Motion

float perlin_fbm(vec2 point) {
	/*
	Implement 2D fBm as described in the handout. Like in the 1D case, you
	should use the constants num_octaves, freq_multiplier, and ampl_multiplier. 
	*/

	float freq = 1.;
	float ampl = 1.;

	float p = 0.;

	for (int i = 0; i < num_octaves; i++){
		p += ampl * perlin_noise(freq * point);
		freq *= freq_multiplier;
		ampl *= ampl_multiplier;
	}

	return p;
}

vec3 tex_fbm(vec2 point) {
	// Visualize noise as a vec3 color
	float noise_val = perlin_fbm(point) + 0.5;
	return vec3(noise_val);
}

vec3 tex_fbm_for_terrain(vec2 point) {
	// scale by 0.25 for a reasonably shaped terrain
	// the +0.5 transforms it to 0..1 range - for the case of writing it to a non-float textures on older browsers or GLES3
	float noise_val = (perlin_fbm(point) * 0.25) + 0.5;
	return vec3(noise_val);
}

// ==============================================================
// 2D turbulence

float turbulence(vec2 point) {
	/*
	Implement the 2D turbulence function as described in the handout.
	Again, you should use num_octaves, freq_multiplier, and ampl_multiplier.
	*/
	float freq = 1.;
	float ampl = 1.;

	float p = 0.;

	for (int i = 0; i < num_octaves; i++){
		p += ampl * abs(perlin_noise(freq * point));
		freq *= freq_multiplier;
		ampl *= ampl_multiplier;
	}

	return p;
}

vec3 tex_turbulence(vec2 point) {
	// Visualize noise as a vec3 color
	float noise_val = turbulence(point);
	return vec3(noise_val);
}

// ==============================================================
// Procedural "map" texture

const float terrain_water_level = -0.075;
const vec3 terrain_color_water = vec3(0.29, 0.51, 0.62);
const vec3 terrain_color_grass = vec3(0.43, 0.53, 0.23);
const vec3 terrain_color_mountain = vec3(0.8, 0.7, 0.7);

vec3 tex_map(vec2 point) {
	/*
	Implement your map texture evaluation routine as described in the handout. 
	You will need to use your perlin_fbm routine and the terrain color constants described above.
	*/
	vec3 color = terrain_color_water;
	float s = perlin_fbm(point);
	if (s >= terrain_water_level){
		float a = s - terrain_water_level; 
		color = mix(terrain_color_grass, terrain_color_mountain, a);
	} 

	return vec3(color);
}

// ==============================================================
// Procedural "wood" texture

const vec3 brown_dark 	= vec3(0.48, 0.29, 0.00);
const vec3 brown_light 	= vec3(0.90, 0.82, 0.62);

vec3 tex_wood(vec2 point) {
	/*
	Implement your wood texture evaluation routine as described in thE handout. 
	You will need to use your 2d turbulence routine and the wood color constants described above.
	*/

	float a = 0.5 * (1. + sin(100. * (sqrt(dot(point, point)) + (0.15 * turbulence(point)))));
	vec3 color = mix(brown_dark, brown_light, a);

	return color;
}


// ==============================================================
// Procedural "marble" texture

const vec3 white 			= vec3(0.95, 0.95, 0.95);

vec3 tex_marble(vec2 point) {
	/*
	Implement your marble texture evaluation routine as described in the handout.
	You will need to use your 2d fbm routine and the marble color constants described above.
	*/

	vec2 q = vec2(perlin_fbm(point), perlin_fbm(point + vec2(1.7, 4.6)));
	float a = 0.5 * (1. + perlin_fbm(point + 4.*q));

	vec3 color = mix(white, brown_dark, a);
	return color;
}


// ==============================================================
// Sand effect

// Elevation adjustment: sharper peaks / flatter valleys
float adjust_elevation(float h, float exponent) {
	return pow(h, exponent);
}

// Terrace effect: discrete steps
float terrace(float h, float steps) {
	return floor(h * steps) / steps;
}

// Combine two control noises (e.g. moisture vs temperature)
float combine_controls(vec2 p, float scaleA, float scaleB, float weightA) {
	float a = perlin_fbm(p * scaleA);
	float b = perlin_fbm(p * scaleB);
	return mix(a, b, weightA);
}

uniform float fb_perlin_multiplier;
uniform float fb_perlin_offset;
uniform float fb_feature_perlin_argument_multiplier;
uniform float fb_feature_exponent;
uniform float fb_feature_perlin_multiplier;

float height_flatbiome(vec2 uv, float border) {
	

	float h = perlin_fbm(uv) * fb_perlin_multiplier + fb_perlin_offset;
	if (h < border) {
		float depth = border - h;
		float feature = perlin_fbm(uv * fb_feature_perlin_argument_multiplier) * pow(depth, fb_feature_exponent);
		return h - feature * fb_feature_perlin_multiplier;
	}
	return h;
}


uniform float comp_perlin_multiplier;
uniform float comp_perlin_offset;
uniform float comp_flat_exponent;
uniform float comp_sharp_exponent;
uniform float comp_ctrl_scaleA;
uniform float comp_ctrl_scaleB;
uniform float comp_ctrl_weightA;
uniform float comp_steps;


// Complex height structure (heightmap generation)
float height_complex(vec2 uv) {
	float base = perlin_fbm(uv) * comp_perlin_multiplier + comp_perlin_offset;
	float flat_  = adjust_elevation(base, comp_flat_exponent);
	float sharp = adjust_elevation(base, comp_sharp_exponent);
	float ctrl  = combine_controls(uv, comp_ctrl_scaleA, comp_ctrl_scaleB, comp_ctrl_weightA);
	float mixed = mix(flat_, sharp, ctrl);
	float terr  = terrace(mixed, comp_steps);
	return terr;
}


uniform float border;

// Main height function called by terrain builder
vec3 tex_sand(vec2 uv) {
	
    float h;
	if (uv.y < border) {
		h = height_flatbiome(uv, border);
	} else {
		h = height_complex(uv);
	}
	 return vec3(h);
}

varying vec2 v2f_tex_coords;

void main() {
	vec3 height = tex_sand(v2f_tex_coords);
	gl_FragColor = vec4(height, 1.0);
}