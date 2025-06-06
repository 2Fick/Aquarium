import {texture_data } from "../../cg_libraries/cg_render_utils.js"
import { ShaderRenderer } from "./shader_renderer.js";


export class DepthOfFieldShaderRenderer extends ShaderRenderer {

    /**
     * Its render function can be used to render scene objects with 
     * just a color or a texture (wihtout shading effect)
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager){
        super(
            regl, 
            resource_manager, 
            `depth_of_field.vert.glsl`, 
            `depth_of_field.frag.glsl`
        );
    }

    /**
     * Render the objects of the scene_state with its shader
     * @param {*} scene_state 
     */
    render(scene_state, rendered_base){

        const scene = scene_state.scene
        const inputs = []

        for (const obj of scene.objects) {

            if(this.exclude_object(obj)) continue;
            const mesh = this.resource_manager.get_mesh(obj.mesh_reference);
            

            const { 
                mat_model_view, 
                mat_model_view_projection, 
                mat_normals_model_view 
            } = scene.camera.object_matrices.get(obj);

            inputs.push({
                mesh: mesh,

                mat_model_view_projection: mat_model_view_projection,
                mat_model_view: mat_model_view,

                canvas_width: scene_state.frame.framebufferWidth, 
                canvas_height: scene_state.frame.framebufferHeight,

                color_texture: rendered_base,
                
                minFocusDistance: scene_state.ui_params.minFocusDistance,
                maxFocusDistance: scene_state.ui_params.maxFocusDistance,
            });
        }

        this.pipeline(inputs);
    }

    uniforms(regl){        
        return {
            // View (camera) related matrix
            mat_model_view_projection: regl.prop('mat_model_view_projection'),
            mat_model_view: regl.prop('mat_model_view'),

            canvas_width: regl.prop("canvas_width"),
            canvas_height: regl.prop("canvas_height"),

            // Material data
            color_texture: regl.prop('color_texture'),

            minFocusDistance: regl.prop('minFocusDistance'),
            maxFocusDistance: regl.prop('maxFocusDistance'),
        };
    }
}