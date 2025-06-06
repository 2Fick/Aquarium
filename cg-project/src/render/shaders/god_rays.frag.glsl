// volumetric.frag (WebGL 1.0 / GLSL ES 1.00)
precision highp float;

varying vec3 world_position_frag;
varying vec3 normal;

uniform vec3 cam_pos;
uniform float step_size;
uniform int max_step;
const vec3 ambient_light = vec3(1.);
uniform float scattering_coeff;
uniform float absorbtion_coeff;
uniform float normalization;
uniform float frequency;
uniform int sphere_light;
uniform float time;

uniform vec3 light_pos;
uniform vec3 light_color;
uniform float light_strength;

#define NUM_GRADIENTS 12

const float box_size = 200.0;

// 2D Simplex Noise
// Author: Ian McEwan, Ashima Arts (Public Domain)
vec3 mod289(vec3 x) {
	return x - floor(x * (1.0 / 289.0)) * 289.0;
}

float snoise(vec2 v) {
	const vec4 C = vec4(0.211324865405187,  // (3.0 - sqrt(3.0)) / 6.0
	0.366025403784439,  // 0.5 * (sqrt(3.0) - 1.0)
	-0.577350269189626,  // -1.0 + 2.0 * C.x
	0.024390243902439); // 1.0 / 41.0
  // First corner
	vec2 i = floor(v + dot(v, C.yy));
	vec2 x0 = v - i + dot(i, C.xx);

  // Other corners
	vec2 i1;
	i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
	vec4 x12 = x0.xyxy + C.xxzz;
	x12.xy -= i1;

  // Permutations
	vec3 p = mod289(vec3(i.x, i.x + i1.x, i.x + 1.0));
	vec3 q = mod289(vec3(i.y, i.y + i1.y, i.y + 1.0));
	vec3 x = fract(p * C.w) + fract(q * C.w) * 7.0;
	vec3 h = 1.0 - abs(x - 0.5) * 2.0;

	vec3 b0 = floor(x) * 2.0 + 1.0;
	vec3 b1 = ceil(x) * 2.0 - 1.0;

	vec3 g0 = vec3(b0.x, b1.x, b0.y);
	vec3 g1 = vec3(b1.y, b0.z, b1.z);

	vec2 g00 = vec2(g0.x, g1.x);
	vec2 g10 = vec2(g0.y, g1.y);
	vec2 g01 = vec2(g0.z, g1.z);

	vec3 norm = 1.79284291400159 - 0.85373472095314 *
		vec3(dot(g00, g00), dot(g10, g10), dot(g01, g01));
	g00 *= norm.x;
	g10 *= norm.y;
	g01 *= norm.z;

  // Noise contributions from the three corners
	float t0 = 0.5 - dot(x0, x0);
	float n0 = (t0 < 0.0) ? 0.0 : pow(t0, 4.0) * dot(g00, x0);

	float t1 = 0.5 - dot(x12.xy, x12.xy);
	float n1 = (t1 < 0.0) ? 0.0 : pow(t1, 4.0) * dot(g10, x12.xy);

	float t2 = 0.5 - dot(x12.zw, x12.zw);
	float n2 = (t2 < 0.0) ? 0.0 : pow(t2, 4.0) * dot(g01, x12.zw);

  // Final noise value
	return 70.0 * (n0 + n1 + n2);
}

float hash_poly(float x) {
	return mod(((x * 34.0) + 1.0) * x, 289.0);
}

// Constants for FBM
const float freq_multiplier = 2.17;
const float ampl_multiplier = 0.5;
const int num_octaves = 4;

bool is_in_cube(vec3 pos, vec3 square_pos, float size) {
	float x_pos = abs(pos.x - square_pos.x);
	float y_pos = abs(pos.y - square_pos.y);
	float z_pos = abs(pos.z - square_pos.y);

	return (x_pos < size / 2.) && (y_pos < size / 2.) && (z_pos < size / 2.);
}

// Y start
// --- 3D hash and gradients ---
int hash_func3(vec3 grid_point) {
	return int(mod(hash_poly(hash_poly(hash_poly(grid_point.x) + grid_point.y) + grid_point.z), float(NUM_GRADIENTS)));
}

vec3 gradients3(int i) {
    // 12 directions on the unit sphere (could be improved)
	if(i == 0)
		return vec3(1, 1, 0);
	if(i == 1)
		return vec3(-1, 1, 0);
	if(i == 2)
		return vec3(1, -1, 0);
	if(i == 3)
		return vec3(-1, -1, 0);
	if(i == 4)
		return vec3(1, 0, 1);
	if(i == 5)
		return vec3(-1, 0, 1);
	if(i == 6)
		return vec3(1, 0, -1);
	if(i == 7)
		return vec3(-1, 0, -1);
	if(i == 8)
		return vec3(0, 1, 1);
	if(i == 9)
		return vec3(0, -1, 1);
	if(i == 10)
		return vec3(0, 1, -1);
	if(i == 11)
		return vec3(0, -1, -1);
	return vec3(0, 0, 1);
}

float perlin_noise3(vec3 p) {
	vec3 pi = floor(p);
	vec3 pf = p - pi;

	float res = 0.0;
	for(int xi = 0; xi <= 1; xi++) for(int yi = 0; yi <= 1; yi++) for(int zi = 0; zi <= 1; zi++) {
				vec3 corner = vec3(float(xi), float(yi), float(zi));
				vec3 grad = gradients3(hash_func3(pi + corner));
				vec3 diff = pf - corner;
				float weight = (xi == 0 ? 1.0 - pf.x : pf.x) *
					(yi == 0 ? 1.0 - pf.y : pf.y) *
					(zi == 0 ? 1.0 - pf.z : pf.z);
				res += dot(grad, diff) * weight;
			}
	return res;
}

float fbm3(vec3 p, float frequency, int num_octaves) {
	float freq = frequency;
	float ampl = 1.0;
	float sum = 0.0;

	int current_octave = 0;
	for(int i = 0; i < 10; i++) {
		sum += ampl * perlin_noise3(p * freq);
		freq *= freq_multiplier;
		ampl *= ampl_multiplier;
		current_octave++;
		if(current_octave >= num_octaves) {
			break;
		}
	}
	return sum;
}

float edgeFalloff(vec3 p, float size, float margin) {
    // Compute distance to each axis-aligned border
	float halfSize = size * 0.5;
	vec3 distToEdge = halfSize - abs(p);

    // Remap from [margin, 0] to [1, 0] with smoothstep
	float fx = smoothstep(0.0, margin, distToEdge.x);
	float fy = smoothstep(0.0, margin, distToEdge.y);
	float fz = smoothstep(0.0, margin, distToEdge.z);

    // Combine all three axis falloffs
	return fx * fy * fz;
}

float density3d(vec3 p) {
	vec3 offset = vec3(0.3, 0.1, 0.2) * time * 10.;

	return (fbm3(p + offset, frequency, num_octaves) + normalization) * edgeFalloff(p, box_size, 20.) * 0.5;
}
// Y end

float get_light_intensity(vec3 pos, vec3 light_pos) {
	float dist = length(pos - light_pos);
	vec3 light_dir = normalize(pos - light_pos);

	vec3 offset = vec3(0.1, 0.3, 0.4) * time / 8.;
	float smog = fbm3(light_dir + offset, 10., 1);

	if(sphere_light == 1) {
		smog = 1.0;
	}
	return max(0.0, light_strength * smog / (dist * dist));
}

float get_current_step_size(int num_steps, float step_size) {
	float current_step_size = step_size;
	if(num_steps > 0) {
		current_step_size = step_size * float(num_steps);
	}
	return current_step_size;
}

void main() {

	float transmittance = 1.0;
	vec3 illumination = vec3(0.0);

	float extinction_coeff = absorbtion_coeff + scattering_coeff;

	vec3 samplePos = world_position_frag;

	vec3 cam_dir = normalize(samplePos - cam_pos);

	if(is_in_cube(vec3(cam_pos), vec3(0., 0., 0.), box_size)) {
		samplePos = cam_pos;
	}

	int num_steps = 0;
	float current_step_size;

	for(int i = 0; i < 1000; i++) {

		current_step_size = get_current_step_size(num_steps, step_size);

		//raymarch
		samplePos += cam_dir * current_step_size;

		if(num_steps >= max_step || !is_in_cube(samplePos, vec3(0., 0., 0.), box_size)) {
			break;
		}

		// transmitance
		float currentDensity = density3d(samplePos);
		transmittance *= exp(-currentDensity * extinction_coeff * current_step_size);

		float light_intensity = get_light_intensity(samplePos, light_pos);

		vec3 in_scatter = ambient_light + light_intensity * light_color;
		float out_scatter = scattering_coeff * currentDensity;

		vec3 currentLight = in_scatter * out_scatter;

		illumination += transmittance * currentLight * current_step_size;

		num_steps++;
	}

	//gl_FragColor = vec4(illumination, transmittance);
	gl_FragColor = vec4(illumination, 1. - transmittance);
	//gl_FragColor = vec4(cam_dir, 1.);
}
