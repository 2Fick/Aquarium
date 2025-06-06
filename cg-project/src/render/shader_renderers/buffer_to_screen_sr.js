
import { ShaderRenderer } from "./shader_renderer.js";




export class BufferToScreenShaderRenderer extends ShaderRenderer {

    /**
     * Its render function can be used to display a buffer's content on the canvas
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager){
        super(
            regl, 
            resource_manager, 
            `buffer_to_screen.vert.glsl`, 
            `buffer_to_screen.frag.glsl`
        );
    }

    /**
     * 
     * @param {*} mesh_quad_2d a basic square mesh
     * @param {*} buffer_to_draw the buffer to be drawn on the canvas
     */
    render(mesh_quad_2d, buffer_to_draw){

        const inputs = [];
        
        inputs.push({
            mesh_quad_2d: mesh_quad_2d,
            buffer_to_draw : buffer_to_draw,
        })

        this.pipeline(inputs);
    }

    // Overwrite the pipeline
    init_pipeline(){
        const regl = this.regl

        return regl({
            attributes: {
                vertex_positions: regl.prop('mesh_quad_2d.vertex_positions')
            },

            elements: regl.prop('mesh_quad_2d.faces'),

            uniforms: {
                buffer_to_draw: regl.prop('buffer_to_draw'),
            },
            
            vert: this.vert_shader,
            frag: this.frag_shader,
        })
    } 
}
