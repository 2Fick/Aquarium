import { cg_mesh_make_uv_sphere, cg_mesh_load_obj_into_regl, mesh_upload_to_buffer } from "../cg_libraries/cg_mesh.js"
import { load_image, load_text, load_texture } from "../cg_libraries/cg_web.js"
import { vec3, vec4, mat3, mat4 } from "../../lib/gl-matrix_3.3.0/esm/index.js"
import { ProceduralTextureGenerator } from "../render/procedural_texture_generator.js";
import { mesh_preprocess } from "../render/shader_renderers/normals_shader_renderer.js";

export class ResourceManager{

    /**
     * This class handles all the resources need by the render process
     * - shader file content
     * - mesh description
     * - texture data
     * - heigth map
     * @param {*} regl 
     */
    constructor(regl){
        this.regl = regl;
        this.resources = null;
    }

    /**
     * Function to call right after creation. It will start loading 
     * all the wanted resources from the folder
     * @returns 
     */
    async load_resources(){
        const regl = this.regl;

        const path_to_meshes_folder = './assets/meshes';
        const path_to_textures_folder = "./assets/textures";
        const path_to_shaders_folder = './src/render/shaders';

        // Start downloads in parallel
        const resource_promises = {};

        // load textures
        for (const texture_name of this.textures_to_load()) {
            resource_promises[texture_name] = load_texture(regl, `${path_to_textures_folder}/${texture_name}`);
        }
        // load shaders
        for (const shader_name of this.shaders_to_load()) {
            resource_promises[shader_name] = load_text(`${path_to_shaders_folder}/${shader_name}`);
        }
        // load meshes
        for (const mesh_name of this.meshes_to_load()) {
          resource_promises[mesh_name] = cg_mesh_load_obj_into_regl(regl, `${path_to_meshes_folder}/${mesh_name}`);
        }
    
        // Cube map
        // We load cube sides as images because we will put them into the cubemap constructor
        for (let cube_side_idx = 0; cube_side_idx < 6; cube_side_idx++) {
            const texture_name = `cube_side_${cube_side_idx}.png`;
            resource_promises[texture_name] = load_image(`${path_to_textures_folder}/${texture_name}`);
        }

        // Wait for all downloads to complete
        const resources = {}
        for (const [key, promise] of Object.entries(resource_promises)) {
            resources[key] = await promise;
        }

        // Textures which are not loaded from files but created in code
        generate_textures(regl, resources);

        this.resources = resources;
        return this;
    }

    /**
     * Get the shader_name shader data from the resources
     * @param {*} shader_name  
     * @returns the shader_name file content
     */
    get_shader(shader_name){
        return this.get(shader_name);
    }

    /**
     * Test wether this mesh exists in the resources and returns it
     * @param {*} mesh_reference 
     * @returns 
     */
    get_mesh(mesh_reference){
        return this.get(mesh_reference);
    }

    /**
     * Test wether this texture exists in the resources and returns it
     * @param {*} texture_name 
     * @returns 
     */
    get_texture(texture_name){
      return this.get(texture_name);
    }

    /**
     * Try to get a resource based on its name
     * @param {*} name the name of the resource to get
     * @returns 
     */
    get(name){
        if(!name){
          throw new Error(`Bad resource name ${name}`);
        }

        const resource_content = this.resources[name]
        if(!resource_content){
            throw new ReferenceError(`No resource "${resource_content}"`+
                " 1. check the name is correct" +
                " 2. check the file is correctly loaded"
            );
        }
        return resource_content;
    }

    /**
     * Add a newly computed mesh to this resources manager
     * @param {*} name the name that will be used to retrieve the mesh data
     * @param {*} mesh the vertices, normals, faces, uv_coord arrays
     */
    add_procedural_mesh(name, mesh){
      this.resources[name] = mesh_upload_to_buffer(this.regl, mesh);
    }

    /**
     * Fetch the height map from the resources array
     * @param {*} heigtmap_name 
     * @returns 
     */
    get_heightmap(heigtmap_name){
      return this.get(heigtmap_name);
    }

    // Resources to be loaded

    textures_to_load(){
        return [
            'kloppenheim_07_puresky_blur.jpg',
            'pine.png',
            'regent_street.jpg',
            'marble.png',
            'fish_texture.png',
            'underwater.jpg',
            'test.jpg',
            "nemo_text.png",
            "angler.png",
          ];
    }

    shaders_to_load(){
        return [
            'blinn_phong.vert.glsl', 'blinn_phong.frag.glsl',
            'point_light_shadows.vert.glsl', 'point_light_shadows.frag.glsl',
            'flat_color.vert.glsl', 'flat_color.frag.glsl',
            'map_mixer.vert.glsl', 'map_mixer.frag.glsl',
            'mirror.vert.glsl', 'mirror.frag.glsl',
            'shadow_map.vert.glsl', 'shadow_map.frag.glsl',
            'cubemap_visualization.vert.glsl', 'cubemap_visualization.frag.glsl',
            'noise.vert.glsl', 'noise.frag.glsl',
            `buffer_to_screen.vert.glsl`, `buffer_to_screen.frag.glsl`,
            'terrain.vert.glsl', 'terrain.frag.glsl',
            'normals.vert.glsl','normals.frag.glsl',
            'depth_of_field.vert.glsl', 'depth_of_field.frag.glsl',
            'transparent_color.vert.glsl', 'transparent_color.frag.glsl',
            'god_rays.vert.glsl','god_rays.frag.glsl'
          ];
    }

    meshes_to_load() {
        return [
        "pine.obj",
        "suzanne.obj",
        "dof.obj",
        "fish.obj",
        "angler.obj",
        "nemo.obj",
      ];
    }
}



/**
 * Construct textures from basic colors.
 * @param {*} regl 
 * @param {*} resources 
 */
function generate_textures(regl, resources) {

    const make_texture_from_color = (color) => {
      const c = vec3.scale([0, 0, 0], color, 255)
  
      return regl.texture({
        data: [
          [c, c],
          [c, c],
        ],
        colorType: 'uint8',
      })
    }
  
    resources['tex_red'] = make_texture_from_color([0.7, 0.15, 0.05])
    resources['tex_gold'] = make_texture_from_color([0.7, 0.5, 0.0])
    resources['tex_blue'] = make_texture_from_color([0.1, 0.5, 0.7])
    resources['tex_gray'] = make_texture_from_color([0.4, 0.4, 0.4])
    resources['tex_green'] = make_texture_from_color([0.15, 0.4, 0.1])
    resources['tex_light_green'] = make_texture_from_color([0.45, 0.8, 0.2])
    resources['tex_water'] = make_texture_from_color([0.29, 0.51, 0.62])
    resources['tex_water_identifier'] = make_texture_from_color([0.0, 0.0, 1.0])
    resources['tex_water_wall_identifier'] = make_texture_from_color([0.0, 1.0, 1.0])
    resources['tex_terrain'] = make_texture_from_color([1.0, 0.0, 0.0])
  
  }
  

