precision mediump float;

// Varying values passed from the vertex shader
varying vec4 canvas_pos;

// Global variables specified in "uniforms" entry of the pipeline
uniform sampler2D shadows;
uniform sampler2D blinn_phong;
uniform sampler2D fog;

void main() {
    float shadows_strength = 0.4;

    // get uv coordinates in the canvas 
    vec2 uv = (canvas_pos.xy / canvas_pos.w) * 0.5 + 0.5;

    float shadow_factor = texture2D(shadows, uv).x;
    vec3 phong_color = texture2D(blinn_phong, uv).rgb;
    vec4 fog = texture2D(fog, uv);

    float fog_factor = fog.a;
    vec3 fog_color = fog.rgb;

    vec3 shadow_color = (1.0 - (shadow_factor * shadows_strength)) * phong_color;

    vec3 color = phong_color;
    // darken the area where there is shadows
    if(shadow_factor > 0.0) {
        color = shadow_color;
    }

    // apply fog after shadow
    //color = mix(color, fog_color, fog_factor);
    color = mix(color, fog_color, fog_factor * 0.5);

    gl_FragColor = vec4(color, 1.); // output: RGBA in 0..1 range
}