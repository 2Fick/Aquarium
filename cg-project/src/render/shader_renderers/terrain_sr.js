import {texture_data, light_to_cam_view} from "../../cg_libraries/cg_render_utils.js"
import { ResourceManager } from "../../scene_resources/resource_manager.js";
import {ShaderRenderer} from "./shader_renderer.js"


export class TerrainShaderRenderer extends ShaderRenderer {

    /**
     * Dedicated blinn_phong shader for terrain rendering.
     * The main difference is, that it assigned different color to
     * the object based on the altitude of the fragment
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager, blendwidth = 0.2){
        super(
            regl, 
            resource_manager, 
            `terrain.vert.glsl`, 
            `terrain.frag.glsl`
        );
        this.blendwidth = blendwidth;
    }
    
    /**
     * Render all objects that have a "terrain" material.
     * @param {*} scene_state 
     */
    render(scene_state){

        const scene = scene_state.scene;
        const inputs = [];

        let ambient_factor = scene.ambient_factor;

        scene.lights.forEach(light => {
            // Transform light position into camera space
            const light_position_cam = light_to_cam_view(light.position, scene.camera.mat.view);

            for (const obj of scene.objects) {

                if(this.exclude_object(obj)) continue;

                const mesh = this.resource_manager.get_mesh(obj.mesh_reference);
                const {texture, is_textured} = texture_data(obj, this.resource_manager);
                
                const { 
                    mat_model_view, 
                    mat_model_view_projection, 
                    mat_normals_model_view 
                } = scene.camera.object_matrices.get(obj);

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

                    material_water_color: obj.material.water_color,
                    material_water_shininess: obj.material.water_shininess,
                    material_sand_color: obj.material.sand_color,
                    material_sand_shininess: obj.material.sand_shininess,
                    material_deep_water_color:obj.material.deep_water_color,
                    material_deep_water_shininess: obj.material.deep_water_shininess,
                    blendWidth: this.blendwidth

                });

            }

            this.pipeline(inputs);
            // Set to 0 the ambient factor so it is only taken into account once during the first light render
            ambient_factor = 0;
        });
    }

    exclude_object(obj){
        // Exclude all non terrain objects
        return !obj.material.properties.includes('terrain');
    }

    depth(){
        // Use z-buffer
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

            water_color: regl.prop('material_water_color'),
            water_shininess: regl.prop('material_water_shininess'),
            sand_color: regl.prop('material_sand_color'),
            sand_shininess: regl.prop('material_sand_shininess'),
            deep_water_color:regl.prop('material_deep_water_color'),
            deep_water_shininess:regl.prop('material_deep_water_shininess'),
            blendWidth: regl.prop('blendWidth'),
        };
    }
}

