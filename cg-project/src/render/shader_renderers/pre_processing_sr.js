
import { ResourceManager } from "../../scene_resources/resource_manager.js";
import { ShaderRenderer } from "./shader_renderer.js";
import { mesh_preprocess } from "./normals_shader_renderer.js";

export class PreprocessingShaderRenderer extends ShaderRenderer {

    /**
     * Used to run a preprocessing pass that will fill the 
     * z-buffer and pure black default color to all objects
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager){
      // load into the resources manager the shaders that are hardcoded
      resource_manager.resources["pre_processing.vert.glsl"] = pre_processing_vertex_shader();
      resource_manager.resources["pre_processing.frag.glsl"] = pre_processing_fragment_shader();

      super(
          regl, 
          resource_manager, 
          `pre_processing.vert.glsl`, 
          `pre_processing.frag.glsl`
      );
    }

    /**
     * Fill the z-buffer for all the objects in the scene and 
     * color all these objects in pure black
     * @param {*} scene_state 
     */
    render(scene_state){
        const scene = scene_state.scene;
        const inputs = [];

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
            });

        }
        
        this.pipeline(inputs);
    }

    // Overwrite the pipeline
    init_pipeline(){
        const regl = this.regl;
        return regl({

            attributes: {
              vertex_positions: regl.prop('mesh.vertex_positions'), 
            },
          
            elements: regl.prop('mesh.faces'),
          
            blend: {
              enable: false,
            },
          
            uniforms: {
                mat_model_view_projection: regl.prop('mat_model_view_projection'),
            },
          
            vert: this.vert_shader,
            frag: this.frag_shader,
          });
    }

}

// Hard coded shaders, equivalent to defining them in a separate glsl file

function pre_processing_vertex_shader(){
  return `
          precision mediump float;
      
          attribute vec3 vertex_positions;
          uniform mat4 mat_model_view_projection;
      
          void main() {
            gl_Position = mat_model_view_projection * vec4(vertex_positions, 1.0);
          }
        `;
}

function pre_processing_fragment_shader(){
  return `
          precision mediump float;
      
          void main() {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // pure black
          }
        `;
}