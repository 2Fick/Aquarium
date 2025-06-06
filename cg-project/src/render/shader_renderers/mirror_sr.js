
import { EnvironmentCapture } from "../env_capture.js"
import { ShaderRenderer } from "./shader_renderer.js";


export class MirrorShaderRenderer extends ShaderRenderer {

    /**
     * Its render function can be used to render miror effect on reflective objects
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager){
        super(
            regl, 
            resource_manager, 
            `mirror.vert.glsl`, 
            `mirror.frag.glsl`
        );
        this.env_capture = new EnvironmentCapture(regl, resource_manager)
    }

    /**
     * Render the objects of the scene_state with its shader
     * @param {*} scene_state 
     * @param {(scene_state)=>{}} render_scene_function is the function that will we used to render the differents 
     * sides of the cube map. Normally, a mirror reflects exactly the environment around it, so we will generally use 
     * as render function of the cube map the same render that is used for the rest of the scene.
     */
    render(scene_state, render_scene_function){

        const scene = scene_state.scene;
        const inputs = [];

        // WARNING 
        // Current environment cube map do not support more than 1 reflective objects !
        // The cub map computed by one object is overwritten by the second one
        for (const obj of scene.objects) {

            if(this.exclude_object(obj)) continue;

            const mesh = this.resource_manager.get_mesh(obj.mesh_reference);
            console.log(mesh)
            
            const { 
                mat_model_view, 
                mat_model_view_projection, 
                mat_normals_model_view 
            } = scene.camera.object_matrices.get(obj); 
            // Note: if needed, to make the code more efficient we could avoid matrix recomputation for each object
            
            const cube_env_map = this.compute_cube_map(scene_state, obj, render_scene_function);

            inputs.push({
                mesh: mesh,

                mat_model_view_projection: mat_model_view_projection,
                mat_model_view: mat_model_view,
                mat_normals_model_view: mat_normals_model_view,
            
                cube_env_map: cube_env_map,
            });
        }

        this.pipeline(inputs);
    }

    exclude_object(obj){
        // We only consider object that have a reflective material
        return !obj.material.properties.includes("reflective");
    }

    compute_cube_map(scene_state, obj, render_scene_function){
        // Remove the objects from which we render the cube map from the scene_objects, 
        const index = scene_state.scene.objects.indexOf(obj);
        if (index !== -1) {
            scene_state.scene.objects.splice(index, 1);
        }

        // Computation of the cube map
        this.env_capture.capture_scene_cubemap(
            scene_state, 
            obj.translation, 
            render_scene_function,
            scene_state.background_color
        );

        // Place back the object
        scene_state.scene.objects.push(obj);

        return this.env_capture.env_cubemap;
    }

    depth(){
        return {
            enable: true,
            mask: true,
            func: '<=',
        };
    }

    uniforms(regl){
        return {
            // View (camera) related matrix
            mat_model_view_projection: regl.prop('mat_model_view_projection'),
            mat_model_view: regl.prop('mat_model_view'),
            mat_normals_model_view: regl.prop('mat_normals_model_view'),
    
            // Cube map
            cube_env_map: regl.prop('cube_env_map'),
        };
    }

}

