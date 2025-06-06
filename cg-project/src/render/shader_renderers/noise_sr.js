import { ResourceManager } from "../../scene_resources/resource_manager.js";
import { ShaderRenderer } from "./shader_renderer.js";

/**
 * The different noise function existing in the noise.frag.glsl
 */
export const noise_functions = {
    Plots_1d: "plots",
    Perlin: "tex_perlin",
    FBM: "tex_fbm",
    Turbulence: "tex_turbulence",
    Map: "tex_map",
    Wood: "tex_wood",
    FBM_for_terrain: "tex_fbm_for_terrain",
    // HERE I ADDED THE REDIRECTION TO THE METHOD
    Sand: "tex_sand"
};


export class NoiseShaderRenderer extends ShaderRenderer {

    /**
     * Interface the noise shader and allow to choose which noise to compute
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager){
        super(
            regl, 
            resource_manager, 
            `noise.vert.glsl`, 
            `noise.frag.glsl`
        );
    }

    /**
     * 
     * @param {*} mesh_quad_2d 
     * @param {*} noise_buffer 
     * @param {*} shader_func_name 
     * @param {*} viewer_scale 
     * @param {*} viewer_position 
     */
    render(mesh_quad_2d, noise_buffer, shader_func_name, viewer_scale, viewer_position,
        border, fb_perlin_multiplier, fb_perlin_offset, fb_feature_perlin_argument_multiplier, fb_feature_exponent, fb_feature_perlin_multiplier,
        comp_perlin_multiplier, comp_perlin_offset, comp_flat_exponent, comp_sharp_exponent, comp_ctrl_scaleA, comp_ctrl_scaleB, comp_ctrl_weightA, comp_steps

    ){

        this.regl.clear({
            framebuffer: noise_buffer,
            color: [0, 0, 0, 1], 
        })

        const inputs = [];

        inputs.push({
            mesh_quad_2d: mesh_quad_2d,
            viewer_position : viewer_position,
            viewer_scale : viewer_scale,
            noise_buffer : noise_buffer,

            border : border,
            fb_perlin_multiplier: fb_perlin_multiplier,
            fb_perlin_offset: fb_perlin_offset,
            fb_feature_perlin_argument_multiplier: fb_feature_perlin_argument_multiplier,
            fb_feature_exponent: fb_feature_exponent,
            fb_feature_perlin_multiplier: fb_feature_perlin_multiplier,
            comp_perlin_multiplier: comp_perlin_multiplier,
            comp_perlin_offset: comp_perlin_offset,
            comp_flat_exponent: comp_flat_exponent,
            comp_sharp_exponent: comp_sharp_exponent,
            comp_ctrl_scaleA: comp_ctrl_scaleA,
            comp_ctrl_scaleB: comp_ctrl_scaleB,
            comp_ctrl_weightA: comp_ctrl_weightA,
            comp_steps: comp_steps,   
        })

        this.pipeline(inputs);
    }



    // Overwrite the pipeline
    init_pipeline(){
        const regl = this.regl;

        return regl({
            attributes: {
                vertex_positions: regl.prop('mesh_quad_2d.vertex_positions')
            },

            elements: regl.prop('mesh_quad_2d.faces'),
            
            uniforms: {
                viewer_position: regl.prop('viewer_position'),
                viewer_scale:    regl.prop('viewer_scale'),

                border : regl.prop('border'),

                fb_perlin_multiplier: regl.prop('fb_perlin_multiplier'),
                fb_perlin_offset: regl.prop('fb_perlin_offset'),
                fb_feature_perlin_argument_multiplier: regl.prop('fb_feature_perlin_argument_multiplier'),
                fb_feature_exponent: regl.prop('fb_feature_exponent'),
                fb_feature_perlin_multiplier: regl.prop('fb_feature_perlin_multiplier'),

                comp_perlin_multiplier: regl.prop('comp_perlin_multiplier'),
                comp_perlin_offset: regl.prop('comp_perlin_offset'),
                comp_flat_exponent: regl.prop('comp_flat_exponent'),
                comp_sharp_exponent: regl.prop('comp_sharp_exponent'),
                comp_ctrl_scaleA: regl.prop('comp_ctrl_scaleA'),
                comp_ctrl_scaleB: regl.prop('comp_ctrl_scaleB'),
                comp_ctrl_weightA: regl.prop('comp_ctrl_weightA'),
                comp_steps: regl.prop('comp_steps'),
            },
                    
            vert: this.vert_shader,
            frag: this.frag_shader,

            framebuffer: regl.prop('noise_buffer'),
        })
    } 

}