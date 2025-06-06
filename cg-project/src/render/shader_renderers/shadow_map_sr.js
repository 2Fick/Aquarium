
import { ResourceManager } from "../../scene_resources/resource_manager.js";
import { ShaderRenderer } from "./shader_renderer.js";


export class ShadowMapShaderRenderer extends ShaderRenderer {

    /**
     * Used to compute distance of a fragment from the eyes 
     * of the camera. It has application in generating the 
     * shadows cube map.
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager){
        super(
            regl, 
            resource_manager, 
            `shadow_map.vert.glsl`, 
            `shadow_map.frag.glsl`
        );
    }
    
    /**
     * Render the scene in greyscale using the distance between the camera and the fragment.
     * From black (distance = 0) to white.
     * @param {*} scene_state 
     */
    render(scene_state){

        const scene = scene_state.scene;
        const inputs = [];

        for (const obj of scene.objects) {

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
            });
        }

        this.pipeline(inputs);
    }


    cull(){
        return { enable: true }; // don't draw back face
    }

    uniforms(regl){
        return {
            // View (camera) related matrix
            mat_model_view_projection: regl.prop('mat_model_view_projection'),
            mat_model_view: regl.prop('mat_model_view'),
        };
    }

}