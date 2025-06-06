precision mediump float;

varying vec4 canvas_pos;
varying float cam_depth;

uniform sampler2D color_texture;
uniform float canvas_width;
uniform float canvas_height;

uniform float minFocusDistance;
uniform float maxFocusDistance; 

void main() {

    // Box Blur

    // kernel size
    const int size = 10;
    if (size < 0) { return; }
    
    // get uv coordinates in the canvas
    vec2 uv = (canvas_pos.xy / canvas_pos.w) * 0.5 + 0.5;

    vec4 unfocusedColor = vec4(0.0, 0.0, 0.0, 1.0);
    
    // tmp variables for calculating the average color
    float count = 0.0;

    vec2 temp = vec2(0.0, 0.0);

    // loop through the kernel size in both x and y directions
    // and sample an average color for the pixel
    for (int i = -size; i <= size; ++i) {
        for (int j = -size; j <= size; ++j) {
        temp = uv + vec2(float(i)/canvas_width, float(j)/canvas_height);

        // clamp the coordinates to the range [0, 1] for texture sampling
        if (temp.x < 0.0) {
            temp.x = 0.0;
        } else if (temp.x > 1.0) {
            temp.x = 1.0;
        }
        if (temp.y < 0.0) {
            temp.y = 0.0;
        } else if (temp.y > 1.0) {
            temp.y = 1.0;
        }

        unfocusedColor.rgb +=
            texture2D(color_texture, temp).rgb;

        count += 1.0;
        }
    }
    unfocusedColor.rgb /= count;

    // Depth of field effect

    // Two different ways to calculate the focus value:
    float focus = smoothstep(minFocusDistance, maxFocusDistance, cam_depth);
    //float focus = max(min(cam_depth, maxFocusDistance), minFocusDistance) / (maxFocusDistance - minFocusDistance);

    // this one make you high (★‿★)
    //float focus = max(min(cam_depth, maxFocusDistance), minFocusDistance);

    // get the depth value from the depth texture
    // (just the color at that pixel)
    vec4 focusedColor = texture2D(color_texture, uv);

    // mix the two colors based on the focus value
    gl_FragColor = mix(focusedColor, unfocusedColor, focus);
}