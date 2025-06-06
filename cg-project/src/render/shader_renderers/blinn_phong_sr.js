import { texture_data, light_to_cam_view } from "../../cg_libraries/cg_render_utils.js"
import { ResourceManager } from "../../scene_resources/resource_manager.js";
import { ShaderRenderer } from "./shader_renderer.js"


export class BlinnPhongShaderRenderer extends ShaderRenderer {

    /**
     * Its render function can be used to render a scene with the blinn-phong model
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager){
        super(
            regl, 
            resource_manager, 
            `blinn_phong.vert.glsl`, 
            `blinn_phong.frag.glsl`
        );
    }
    
    /**
     * Render the objects of the scene_state with its shader
     * @param {*} scene_state 
     */
    render(scene_state){

        const scene = scene_state.scene;
        const inputs = [];

        let ambient_factor = scene.ambient_factor;

        // For every light in the scene we render the blinn-phong contributions
        // Results will be added on top of each other (see this.blend())
        scene.lights.forEach(light => {

            // Transform light position into camera space
            const light_position_cam = light_to_cam_view(light.position, scene.camera.mat.view);

            for (const obj of scene.objects) {

                // Check if object is Blinn-Phong shaded
                if(this.exclude_object(obj)) continue;

                const mesh = this.resource_manager.get_mesh(obj.mesh_reference);
                const {texture, is_textured} = texture_data(obj, this.resource_manager);
                
                const { 
                    mat_model_view, 
                    mat_model_view_projection, 
                    mat_normals_model_view 
                } = scene.camera.object_matrices.get(obj);
                
                // Data passed to the pipeline to be used by the shader
                inputs.push({
                    mesh: mesh,

                    mat_model_view_projection: mat_model_view_projection,
                    mat_model_view: mat_model_view,
                    mat_normals_model_view: mat_normals_model_view,

                    light_position: light_position_cam,
                    light_color: light.color,

                    ambient_factor : ambient_factor,

                    material_texture: texture,
                    is_textured: is_textured,
                    material_base_color: obj.material.color,
                    material_shininess: obj.material.shininess
                });

            }
            
            this.pipeline(inputs);
            // Set to 0 the ambient factor so it is only taken into account once during the first light render
            ambient_factor = 0;
        });
    }

    exclude_object(obj){
        // Do not shade objects that use other dedicated shader
        return (obj.material.properties.includes('no_blinn_phong')
        || (obj.material.opacity != 1.0)
        || obj.material.properties.includes('water'));
    }

    depth(){
        // Use z buffer
        return {
            enable: true,
            mask: true,
            func: '<=',
        };
    }

    blend(){
        // Additive blend mode
        return {
            enable: true,
            func: {
                src: 1,
                dst: 1,
            },
        };
    }

    uniforms(regl){
        return{
            // View (camera) related matrix
            mat_model_view_projection: regl.prop('mat_model_view_projection'),
            mat_model_view: regl.prop('mat_model_view'),
            mat_normals_model_view: regl.prop('mat_normals_model_view'),
    
            // Light data
            light_position: regl.prop('light_position'),
            light_color: regl.prop('light_color'),

            // Ambient factor
            ambient_factor: regl.prop('ambient_factor'),
    
            // Material data
            material_texture: regl.prop('material_texture'),
            is_textured: regl.prop('is_textured'),
            material_base_color: regl.prop('material_base_color'),
            material_shininess: regl.prop('material_shininess')
        };
    }
}

