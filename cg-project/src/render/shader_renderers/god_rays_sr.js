import { texture_data } from "../../cg_libraries/cg_render_utils.js"
import { ShaderRenderer } from "./shader_renderer.js";


export class GodRaysShaderRenderer extends ShaderRenderer {

    /**
     * Its render function can be used to render scene objects with 
     * just a color or a texture (wihtout shading effect)
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager) {
        super(
            regl,
            resource_manager,
            `god_rays.vert.glsl`,
            `god_rays.frag.glsl`
        );
    }

    /**
     * Render the objects of the scene_state with its shader
     * @param {*} scene_state 
     */
    render(scene_state) {

        const scene = scene_state.scene
        const inputs = []

        for (const obj of scene.objects) {

            if (this.exclude_object(obj)) continue;

            const mesh = this.resource_manager.get_mesh(obj.mesh_reference);
            const { texture, is_textured } = texture_data(obj, this.resource_manager);

            const {
                mat_model_view,
                mat_model_view_projection,
                mat_normals_model_view,
                mat_model_to_world
            } = scene.camera.object_matrices.get(obj);

            inputs.push({
                mesh: mesh,

                mat_model_to_world: mat_model_to_world,
                mat_model_view_projection: mat_model_view_projection,
                mat_normals_model_view: mat_normals_model_view,

                max_step: scene_state.ui_params.max_step,
                step_size: scene_state.ui_params.step_size,
                cam_pos: scene.camera.get_camera_position(),
                cam_look_at: scene.camera.look_at,
                scattering_coeff: scene_state.ui_params.scattering_coeff,
                absorbtion_coeff: scene_state.ui_params.absorbtion_coeff,
                normalization: scene_state.ui_params.normalization,
                frequency: scene_state.ui_params.frequency,
                sphere_light: scene_state.ui_params.sphere_light,
                time: scene_state.ui_params.time,

                light_pos: scene.lights[0].position,
                light_color: scene.lights[0].color,
                light_strength: scene_state.ui_params.light_strength,
            });
        }

        this.pipeline(inputs);
    }

    exclude_object(obj) {
        // Exclude object with environment material: the sky does not cast shadows
        return !obj.material.properties.includes('water');

    }

    blend() {
        return {
            enable: true,
            func: {
                srcRGB: 'src alpha',
                dstRGB: 'one minus src alpha',
                srcAlpha: 'one',
                dstAlpha: 'one minus src alpha'
            },
            equation: 'add',
        };
    }

    depth() {
        return {
            enable: true,
            mask: true,
            func: '<=',
        };
    }

    uniforms(regl) {
        return {
            // View (camera) related matrix
            mat_model_view_projection: regl.prop('mat_model_view_projection'),
            mat_model_to_world: regl.prop('mat_model_to_world'),
            mat_normals_model_view: regl.prop('mat_normals_model_view'),

            // Material data
            max_step: regl.prop('max_step'),
            step_size: regl.prop('step_size'),
            cam_pos: regl.prop('cam_pos'),
            cam_look_at: regl.prop('cam_look_at'),
            scattering_coeff: regl.prop('scattering_coeff'),
            absorbtion_coeff: regl.prop('absorbtion_coeff'),
            normalization: regl.prop('normalization'),
            frequency: regl.prop('frequency'),
            sphere_light: regl.prop('sphere_light'),
            time: regl.prop('time'),

            light_pos: regl.prop('light_pos'),
            light_color: regl.prop('light_color'),
            light_strength: regl.prop('light_strength'),
        };
    }
}