import { ResourceManager } from "../../scene_resources/resource_manager.js";

/*---------------------------------------------------------------
	SUPER CLASS OF ALL THE SHADER RENDERS
---------------------------------------------------------------*/

export class ShaderRenderer {

   /**
    * Init a pipeline for the shader in the arguments.
    * @param {*} regl 
    * @param {ResourceManager} resource_manager 
    * @param {String} vert_shader the name of the vert shader (ex: blinn_phong.vert.glsl)
    * @param {String} frag_shader the name of the frag shader (ex: blinn_phong.frag.glsl)
    */
    constructor(regl, resource_manager, vert_shader, frag_shader){
        this.regl = regl;
        this.resource_manager = resource_manager;

        // load the shader text from the resources manager
        this.vert_shader = resource_manager.get_shader(vert_shader);
        this.frag_shader = resource_manager.get_shader(frag_shader);

        this.pipeline = this.init_pipeline();
    }


    /**
     * Call this function to render a scene with this shader
     * @param {*} scene_state 
     */
    render(scene_state){}

    /**
     * Define in this function the exclusion criteria 
     * (wether this object should be rendered by the current shader or not)
     * @param {*} obj the object to check for exclusion
     * @returns when returning "true" the object is NOT rendered by this shader
     */
    exclude_object(obj){
        return obj.material.opacity != 1.0
            || obj.material.properties.includes('water');
    }

    /**
     * 
     * @param {*} regl 
     * @returns the attributes (positions, normals & textures coordinates) of a mesh 
     */
    attributes(regl){
        return {
            vertex_positions:    regl.prop('mesh.vertex_positions'),
            vertex_normal:      regl.prop('mesh.vertex_normals'),
            vertex_tex_coords:  regl.prop('mesh.vertex_tex_coords'),
        };
    }

    /**
     * https://github.com/regl-project/regl/blob/gh-pages/API.md#culling
     * @returns 
     */
    cull(){
        return { enable: false }; // draw back face
    }

    /**
     * https://github.com/regl-project/regl/blob/gh-pages/API.md#depth-buffer
     * @returns 
     */
    depth(){
        return { enable: true };
    }

    /**
     * https://github.com/regl-project/regl/blob/gh-pages/API.md#blending
     * @returns default blend mode
     */
    blend(){
        return {enable: false};
    }

    /**
     * Uniforms: global data available to the shader
     * https://github.com/regl-project/regl/blob/gh-pages/API.md#uniforms 
     * This function has to be overwritten in children class.
     * @param {*} regl 
     * @returns 
     */
    uniforms(regl){
        return {
            uniform_name_as_it_appears_in_the_glsl : regl.prop('uniform name as it is defined in the entries array passed to the pipeline')
        };
    }

    /**
     * Init a render pipeline that will be used to call the rendering process on the shader
     * The pipeline creation relies on multiple other functions that define parameters.
     * These functions can be overwritten in children class 
     * @returns 
     */
    init_pipeline(){
        const regl = this.regl;

        return regl({
    
            attributes: this.attributes(regl),

            // Faces, as triplets of vertex indices
            elements: regl.prop('mesh.faces'),
            
            depth: this.depth(),

            cull: this.cull(),

            blend: this.blend(),
        
            // Uniforms: global data available to the shader
            uniforms: this.uniforms(regl),
        
            // Shaders
            vert: this.vert_shader,
            frag: this.frag_shader,
        });
    }
}