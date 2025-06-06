import { Scene } from "./scene.js";
import * as MATERIALS from "../render/materials.js"
import { cg_mesh_make_uv_sphere } from "../cg_libraries/cg_mesh.js"
import { terrain_build_mesh } from "../scene_resources/terrain_generation.js"
import { noise_functions } from "../render/shader_renderers/noise_sr.js"
import { ResourceManager } from "../scene_resources/resource_manager.js"
import { ProceduralTextureGenerator } from "../render/procedural_texture_generator.js"
import { 
  create_slider, 
  create_button_with_hotkey, 
  create_hotkey_action,
  create_offset_form
} from "../cg_libraries/cg_web.js";
import { create } from "../../lib/gl-matrix_3.3.0/esm/mat2.js";
import { max } from "../../lib/gl-matrix_3.3.0/esm/vec3.js";


export class SandScene extends Scene{

    /**
   * A pure sand-dune terrain scene—no trees, no skyboxes, just one mesh.
   * @param {ResourceManager} resource_manager
   * @param {ProceduralTextureGenerator} procedural_texture_generator
   */
    constructor(resource_manager,procedural_texture_generator){
        super();

        this.resource_manager = resource_manager;
        this.procedural_texture_generator = procedural_texture_generator;


        this.static_objects = [];
        this.dynamic_objects = [];

        this.initialize_scene();
        this.initialize_actor_actions();
    }


    initialize_scene(){

        this.ui_params.obj_height=0.0
        this.ui_params.width=80
        this.ui_params.height=80
        this.ui_params.height_of_terrain = 1.0;

        this.ui_params.border = 0.3;

        this.ui_params.fb_perlin_multiplier = 0.5;
        this.ui_params.fb_perlin_offset = 0.5;
        this.ui_params.fb_feature_perlin_argument_multiplier = 30.0;
        this.ui_params.fb_feature_exponent = 1.2;
        this.ui_params.fb_feature_perlin_multiplier = 0.1;

        this.ui_params.comp_perlin_multiplier = 0.5;
        this.ui_params.comp_perlin_offset = 0.5;
        this.ui_params.comp_flat_exponent = 0.7;
        this.ui_params.comp_sharp_exponent = 0.5;
        this.ui_params.comp_ctrl_scaleA = 0.5;
        this.ui_params.comp_ctrl_scaleB = 1.2;
        this.ui_params.comp_ctrl_weightA = 0.6;
        this.ui_params.comp_steps = 8.0;




        this.lights.push({
            position : [0.0 , -8.0, 15.0],
            color: [1.0, 1.0, 0.9]
        });
        this.lights.push({
            position : [0.0 , 8.0, 15.0],
            color: [1.0, 1.0, 0.9]
        })

          
        const mesh = cg_mesh_make_uv_sphere(16)
        this.resource_manager.add_procedural_mesh("mesh_sphere_env_map", mesh);

        const height_map = this.procedural_texture_generator.compute_texture(
            "perlin_heightmap", 
            // IF YOU WANT TO CHANGE THE NOISE YOU HAVE TO PUT noise_function.Sand (see noise_sr.js)
            noise_functions.Sand,
            {width: this.ui_params.width, height: this.ui_params.height, height_of_terrain: this.ui_params.height_of_terrain,
                border: this.ui_params.border,
                fb_perlin_multiplier: this.ui_params.fb_perlin_multiplier,
                fb_perlin_offset: this.ui_params.fb_perlin_offset,
                fb_feature_perlin_argument_multiplier: this.ui_params.fb_feature_perlin_argument_multiplier,
                fb_feature_exponent: this.ui_params.fb_feature_exponent,
                fb_feature_perlin_multiplier: this.ui_params.fb_feature_perlin_multiplier,
                comp_perlin_multiplier: this.ui_params.comp_perlin_multiplier,
                comp_perlin_offset: this.ui_params.comp_perlin_offset,
                comp_flat_exponent: this.ui_params.comp_flat_exponent,
                comp_sharp_exponent: this.ui_params.comp_sharp_exponent,
                comp_ctrl_scaleA: this.ui_params.comp_ctrl_scaleA,
                comp_ctrl_scaleB: this.ui_params.comp_ctrl_scaleB,
                comp_ctrl_weightA: this.ui_params.comp_ctrl_weightA,
                comp_steps: this.ui_params.comp_steps
            }
        );
        
        const terrain_mesh = terrain_build_mesh(height_map);
        this.resource_manager.add_procedural_mesh("mesh_terrain", terrain_mesh);
    
    
        this.static_objects.push({
            translation: [0, 0, this.ui_params.obj_height],
            scale: [80., 80., 80.],
            mesh_reference: 'mesh_sphere_env_map',
            material: MATERIALS.sunset_sky
        });

        this.ui_params.terrain_height = 20.0;

        this.TERRAIN_SCALE = [40,40,this.ui_params.terrain_height];

        this.static_objects.push({
            translation: [0, 0, this.ui_params.obj_height],
            scale: this.TERRAIN_SCALE,
            mesh_reference: 'mesh_terrain',
            material: MATERIALS.terrain,
            
        });


        this.objects = this.static_objects.concat(this.dynamic_objects);
    }

    initialize_actor_actions(){

    }

    initialize_ui_params(){

        const min_obj_dim = 0;
        const max_obj_dim = 256;

        create_slider("Dimension of Terrain", [min_obj_dim, max_obj_dim], (value) => {
            this.ui_params.height = value;
            this.ui_params.width = value;
            const height_map = this.procedural_texture_generator.compute_texture(
            "perlin_heightmap",
            noise_functions.Sand,
            { width: this.ui_params.width, height: this.ui_params.height,
                height_of_terrain: this.ui_params.height_of_terrain,
                border: this.ui_params.border,
                fb_perlin_multiplier: this.ui_params.fb_perlin_multiplier,
                fb_perlin_offset: this.ui_params.fb_perlin_offset,
                fb_feature_perlin_argument_multiplier: this.ui_params.fb_feature_perlin_argument_multiplier,
                fb_feature_exponent: this.ui_params.fb_feature_exponent,
                fb_feature_perlin_multiplier: this.ui_params.fb_feature_perlin_multiplier,
                comp_perlin_multiplier: this.ui_params.comp_perlin_multiplier,
                comp_perlin_offset: this.ui_params.comp_perlin_offset,
                comp_flat_exponent: this.ui_params.comp_flat_exponent,
                comp_sharp_exponent: this.ui_params.comp_sharp_exponent,
                comp_ctrl_scaleA: this.ui_params.comp_ctrl_scaleA,
                comp_ctrl_scaleB: this.ui_params.comp_ctrl_scaleB,
                comp_ctrl_weightA: this.ui_params.comp_ctrl_weightA,
                comp_steps: this.ui_params.comp_steps
             }
            );
            const new_terrain_mesh = terrain_build_mesh(height_map);
            this.resource_manager.add_procedural_mesh("mesh_terrain", new_terrain_mesh);
        });

        create_slider("Height plus of Terrain", [0,100], (i) => {
            this.ui_params.terrain_height = i;
            // 2) update the stored TERRAIN_SCALE Z component
            this.TERRAIN_SCALE[2] = i;

            // 3) write that back into your static_objects entry for the terrain
            //    static_objects[1] is the terrain (0 is the sphere)
            this.static_objects[1].scale = this.TERRAIN_SCALE;

            // 4) rebuild the objects array so the renderer sees the change
            this.objects = this.static_objects.concat(this.dynamic_objects);
        })

        //create_slider()
        create_slider("Border", [-10, 10], (i) => {
            console.log(i);
            this.ui_params.border = parseFloat(i) / 10.0;
            const height_map = this.procedural_texture_generator.compute_texture(
                "perlin_heightmap",
                noise_functions.Sand,
                { width: this.ui_params.width, height: this.ui_params.height,
                    border: this.ui_params.border,
                    fb_perlin_multiplier: this.ui_params.fb_perlin_multiplier,
                    fb_perlin_offset: this.ui_params.fb_perlin_offset,
                    fb_feature_perlin_argument_multiplier: this.ui_params.fb_feature_perlin_argument_multiplier,
                    fb_feature_exponent: this.ui_params.fb_feature_exponent,
                    fb_feature_perlin_multiplier: this.ui_params.fb_feature_perlin_multiplier,
                    comp_perlin_multiplier: this.ui_params.comp_perlin_multiplier,
                    comp_perlin_offset: this.ui_params.comp_perlin_offset,
                    comp_flat_exponent: this.ui_params.comp_flat_exponent,
                    comp_sharp_exponent: this.ui_params.comp_sharp_exponent,
                    comp_ctrl_scaleA: this.ui_params.comp_ctrl_scaleA,
                    comp_ctrl_scaleB: this.ui_params.comp_ctrl_scaleB,
                    comp_ctrl_weightA: this.ui_params.comp_ctrl_weightA,
                    comp_steps: this.ui_params.comp_steps
                }
            );
            const new_terrain_mesh = terrain_build_mesh(height_map);
            this.resource_manager.add_procedural_mesh("mesh_terrain", new_terrain_mesh);
        },);

        
    

    create_slider("Vertical span of Terrain", [0, 100], (i) => {
      this.ui_params.terrain_height = i;
      this.TERRAIN_SCALE[2] = this.ui_params.terrain_height;

    })

    

    create_slider("FB perlin multiplier", [0, 100], (i) => {
      this.ui_params.fb_perlin_multiplier = i / 100;
      const height_map = this.procedural_texture_generator.compute_texture(
        "perlin_heightmap",
        noise_functions.Sand,
        {
          width: this.ui_params.width, height: this.ui_params.height,
          border: this.ui_params.border,
          fb_perlin_multiplier: this.ui_params.fb_perlin_multiplier,
          fb_perlin_offset: this.ui_params.fb_perlin_offset,
          fb_feature_perlin_argument_multiplier: this.ui_params.fb_feature_perlin_argument_multiplier,
          fb_feature_exponent: this.ui_params.fb_feature_exponent,
          fb_feature_perlin_multiplier: this.ui_params.fb_feature_perlin_multiplier,
          comp_perlin_multiplier: this.ui_params.comp_perlin_multiplier,
          comp_perlin_offset: this.ui_params.comp_perlin_offset,
          comp_flat_exponent: this.ui_params.comp_flat_exponent,
          comp_sharp_exponent: this.ui_params.comp_sharp_exponent,
          comp_ctrl_scaleA: this.ui_params.comp_ctrl_scaleA,
          comp_ctrl_scaleB: this.ui_params.comp_ctrl_scaleB,
          comp_ctrl_weightA: this.ui_params.comp_ctrl_weightA,
          comp_steps: this.ui_params.comp_steps
        }
      );
      const new_terrain_mesh = terrain_build_mesh(height_map);
      this.resource_manager.add_procedural_mesh("mesh_terrain", new_terrain_mesh);
    })

    create_slider("FB perlin offset", [0, 100], (i) => {
      this.ui_params.fb_perlin_offset = i / 100;
      const height_map = this.procedural_texture_generator.compute_texture(
        "perlin_heightmap",
        noise_functions.Sand,
        {
          width: this.ui_params.width, height: this.ui_params.height,
          border: this.ui_params.border,
          fb_perlin_multiplier: this.ui_params.fb_perlin_multiplier,
          fb_perlin_offset: this.ui_params.fb_perlin_offset,
          fb_feature_perlin_argument_multiplier: this.ui_params.fb_feature_perlin_argument_multiplier,
          fb_feature_exponent: this.ui_params.fb_feature_exponent,
          fb_feature_perlin_multiplier: this.ui_params.fb_feature_perlin_multiplier,
          comp_perlin_multiplier: this.ui_params.comp_perlin_multiplier,
          comp_perlin_offset: this.ui_params.comp_perlin_offset,
          comp_flat_exponent: this.ui_params.comp_flat_exponent,
          comp_sharp_exponent: this.ui_params.comp_sharp_exponent,
          comp_ctrl_scaleA: this.ui_params.comp_ctrl_scaleA,
          comp_ctrl_scaleB: this.ui_params.comp_ctrl_scaleB,
          comp_ctrl_weightA: this.ui_params.comp_ctrl_weightA,
          comp_steps: this.ui_params.comp_steps
        }
      );
      const new_terrain_mesh = terrain_build_mesh(height_map);
      this.resource_manager.add_procedural_mesh("mesh_terrain", new_terrain_mesh);
    });

    

    create_slider("FB feature exponent", [0, 100], (i) => {
      this.ui_params.fb_feature_exponent = i / 10;
      const height_map = this.procedural_texture_generator.compute_texture(
        "perlin_heightmap",
        noise_functions.Sand,
        {
          width: this.ui_params.width, height: this.ui_params.height,
          border: this.ui_params.border,
          fb_perlin_multiplier: this.ui_params.fb_perlin_multiplier,
          fb_perlin_offset: this.ui_params.fb_perlin_offset,
          fb_feature_perlin_argument_multiplier: this.ui_params.fb_feature_perlin_argument_multiplier,
          fb_feature_exponent: this.ui_params.fb_feature_exponent,
          fb_feature_perlin_multiplier: this.ui_params.fb_feature_perlin_multiplier,
          comp_perlin_multiplier: this.ui_params.comp_perlin_multiplier,
          comp_perlin_offset: this.ui_params.comp_perlin_offset,
          comp_flat_exponent: this.ui_params.comp_flat_exponent,
          comp_sharp_exponent: this.ui_params.comp_sharp_exponent,
          comp_ctrl_scaleA: this.ui_params.comp_ctrl_scaleA,
          comp_ctrl_scaleB: this.ui_params.comp_ctrl_scaleB,
          comp_ctrl_weightA: this.ui_params.comp_ctrl_weightA,
          comp_steps: this.ui_params.comp_steps
        }
      );
      const new_terrain_mesh = terrain_build_mesh(height_map);
      this.resource_manager.add_procedural_mesh("mesh_terrain", new_terrain_mesh);
    });

    create_slider("FB feature perlin multiplier", [0, 100], (i) => {
      this.ui_params.fb_feature_perlin_multiplier = i / 100;
      const height_map = this.procedural_texture_generator.compute_texture(
        "perlin_heightmap",
        noise_functions.Sand,
        {
          width: this.ui_params.width, height: this.ui_params.height,
          border: this.ui_params.border,
          fb_perlin_multiplier: this.ui_params.fb_perlin_multiplier,
          fb_perlin_offset: this.ui_params.fb_perlin_offset,
          fb_feature_perlin_argument_multiplier: this.ui_params.fb_feature_perlin_argument_multiplier,
          fb_feature_exponent: this.ui_params.fb_feature_exponent,
          fb_feature_perlin_multiplier: this.ui_params.fb_feature_perlin_multiplier,
          comp_perlin_multiplier: this.ui_params.comp_perlin_multiplier,
          comp_perlin_offset: this.ui_params.comp_perlin_offset,
          comp_flat_exponent: this.ui_params.comp_flat_exponent,
          comp_sharp_exponent: this.ui_params.comp_sharp_exponent,
          comp_ctrl_scaleA: this.ui_params.comp_ctrl_scaleA,
          comp_ctrl_scaleB: this.ui_params.comp_ctrl_scaleB,
          comp_ctrl_weightA: this.ui_params.comp_ctrl_weightA,
          comp_steps: this.ui_params.comp_steps
        }
      );
      const new_terrain_mesh = terrain_build_mesh(height_map);
      this.resource_manager.add_procedural_mesh("mesh_terrain", new_terrain_mesh);
    }
    );

    create_slider("Comp perlin multiplier", [0, 100], (i) => {
      this.ui_params.comp_perlin_multiplier = i / 100;
      const height_map = this.procedural_texture_generator.compute_texture(
        "perlin_heightmap",
        noise_functions.Sand,
        {
          width: this.ui_params.width, height: this.ui_params.height,
          border: this.ui_params.border,
          fb_perlin_multiplier: this.ui_params.fb_perlin_multiplier,
          fb_perlin_offset: this.ui_params.fb_perlin_offset,
          fb_feature_perlin_argument_multiplier: this.ui_params.fb_feature_perlin_argument_multiplier,
          fb_feature_exponent: this.ui_params.fb_feature_exponent,
          fb_feature_perlin_multiplier: this.ui_params.fb_feature_perlin_multiplier,
          comp_perlin_multiplier: this.ui_params.comp_perlin_multiplier,
          comp_perlin_offset: this.ui_params.comp_perlin_offset,
          comp_flat_exponent: this.ui_params.comp_flat_exponent,
          comp_sharp_exponent: this.ui_params.comp_sharp_exponent,
          comp_ctrl_scaleA: this.ui_params.comp_ctrl_scaleA,
          comp_ctrl_scaleB: this.ui_params.comp_ctrl_scaleB,
          comp_ctrl_weightA: this.ui_params.comp_ctrl_weightA,
          comp_steps: this.ui_params.comp_steps
        }
      );
      const new_terrain_mesh = terrain_build_mesh(height_map);
      this.resource_manager.add_procedural_mesh("mesh_terrain", new_terrain_mesh);
    }
    );

    create_slider("Comp perlin offset", [0, 100], (i) => {
      this.ui_params.comp_perlin_offset = i / 100;
      const height_map = this.procedural_texture_generator.compute_texture(
        "perlin_heightmap",
        noise_functions.Sand,
        {
          width: this.ui_params.width, height: this.ui_params.height,
          border: this.ui_params.border,
          fb_perlin_multiplier: this.ui_params.fb_perlin_multiplier,
          fb_perlin_offset: this.ui_params.fb_perlin_offset,
          fb_feature_perlin_argument_multiplier: this.ui_params.fb_feature_perlin_argument_multiplier,
          fb_feature_exponent: this.ui_params.fb_feature_exponent,
          fb_feature_perlin_multiplier: this.ui_params.fb_feature_perlin_multiplier,
          comp_perlin_multiplier: this.ui_params.comp_perlin_multiplier,
          comp_perlin_offset: this.ui_params.comp_perlin_offset,
          comp_flat_exponent: this.ui_params.comp_flat_exponent,
          comp_sharp_exponent: this.ui_params.comp_sharp_exponent,
          comp_ctrl_scaleA: this.ui_params.comp_ctrl_scaleA,
          comp_ctrl_scaleB: this.ui_params.comp_ctrl_scaleB,
          comp_ctrl_weightA: this.ui_params.comp_ctrl_weightA,
          comp_steps: this.ui_params.comp_steps
        }
      );
      const new_terrain_mesh = terrain_build_mesh(height_map);
      this.resource_manager.add_procedural_mesh("mesh_terrain", new_terrain_mesh);
    }
    );
    create_slider("Comp flat exponent", [0, 100], (i) => {
      this.ui_params.comp_flat_exponent = i / 10;
      const height_map = this.procedural_texture_generator.compute_texture(
        "perlin_heightmap",
        noise_functions.Sand,
        {
          width: this.ui_params.width, height: this.ui_params.height,
          border: this.ui_params.border,
          fb_perlin_multiplier: this.ui_params.fb_perlin_multiplier,
          fb_perlin_offset: this.ui_params.fb_perlin_offset,
          fb_feature_perlin_argument_multiplier: this.ui_params.fb_feature_perlin_argument_multiplier,
          fb_feature_exponent: this.ui_params.fb_feature_exponent,
          fb_feature_perlin_multiplier: this.ui_params.fb_feature_perlin_multiplier,
          comp_perlin_multiplier: this.ui_params.comp_perlin_multiplier,
          comp_perlin_offset: this.ui_params.comp_perlin_offset,
          comp_flat_exponent: this.ui_params.comp_flat_exponent,
          comp_sharp_exponent: this.ui_params.comp_sharp_exponent,
          comp_ctrl_scaleA: this.ui_params.comp_ctrl_scaleA,
          comp_ctrl_scaleB: this.ui_params.comp_ctrl_scaleB,
          comp_ctrl_weightA: this.ui_params.comp_ctrl_weightA,
          comp_steps: this.ui_params.comp_steps
        }
      );
      const new_terrain_mesh = terrain_build_mesh(height_map);
      this.resource_manager.add_procedural_mesh("mesh_terrain", new_terrain_mesh);
    }
    );

    create_slider("Comp sharp exponent", [0, 100], (i) => {
      this.ui_params.comp_sharp_exponent = i / 10;
      const height_map = this.procedural_texture_generator.compute_texture(
        "perlin_heightmap",
        noise_functions.Sand,
        {
          width: this.ui_params.width, height: this.ui_params.height,
          border: this.ui_params.border,
          fb_perlin_multiplier: this.ui_params.fb_perlin_multiplier,
          fb_perlin_offset: this.ui_params.fb_perlin_offset,
          fb_feature_perlin_argument_multiplier: this.ui_params.fb_feature_perlin_argument_multiplier,
          fb_feature_exponent: this.ui_params.fb_feature_exponent,
          fb_feature_perlin_multiplier: this.ui_params.fb_feature_perlin_multiplier,
          comp_perlin_multiplier: this.ui_params.comp_perlin_multiplier,
          comp_perlin_offset: this.ui_params.comp_perlin_offset,
          comp_flat_exponent: this.ui_params.comp_flat_exponent,
          comp_sharp_exponent: this.ui_params.comp_sharp_exponent,
          comp_ctrl_scaleA: this.ui_params.comp_ctrl_scaleA,
          comp_ctrl_scaleB: this.ui_params.comp_ctrl_scaleB,
          comp_ctrl_weightA: this.ui_params.comp_ctrl_weightA,
          comp_steps: this.ui_params.comp_steps
        }
      );
      const new_terrain_mesh = terrain_build_mesh(height_map);
      this.resource_manager.add_procedural_mesh("mesh_terrain", new_terrain_mesh);
    }
    );

    create_slider("Comp ctrl scale A", [0, 100], (i) => {
      this.ui_params.comp_ctrl_scaleA = i / 100;
      const height_map = this.procedural_texture_generator.compute_texture(
        "perlin_heightmap",
        noise_functions.Sand,
        {
          width: this.ui_params.width, height: this.ui_params.height,
          border: this.ui_params.border,
          fb_perlin_multiplier: this.ui_params.fb_perlin_multiplier,
          fb_perlin_offset: this.ui_params.fb_perlin_offset,
          fb_feature_perlin_argument_multiplier: this.ui_params.fb_feature_perlin_argument_multiplier,
          fb_feature_exponent: this.ui_params.fb_feature_exponent,
          fb_feature_perlin_multiplier: this.ui_params.fb_feature_perlin_multiplier,
          comp_perlin_multiplier: this.ui_params.comp_perlin_multiplier,
          comp_perlin_offset: this.ui_params.comp_perlin_offset,
          comp_flat_exponent: this.ui_params.comp_flat_exponent,
          comp_sharp_exponent: this.ui_params.comp_sharp_exponent,
          comp_ctrl_scaleA: this.ui_params.comp_ctrl_scaleA,
          comp_ctrl_scaleB: this.ui_params.comp_ctrl_scaleB,
          comp_ctrl_weightA: this.ui_params.comp_ctrl_weightA,
          comp_steps: this.ui_params.comp_steps
        }
      );
      const new_terrain_mesh = terrain_build_mesh(height_map);
      this.resource_manager.add_procedural_mesh("mesh_terrain", new_terrain_mesh);
    }
    );

    create_slider("Comp ctrl scale B", [0, 100], (i) => {
      this.ui_params.comp_ctrl_scaleB = i / 100;
      const height_map = this.procedural_texture_generator.compute_texture(
        "perlin_heightmap",
        noise_functions.Sand,
        {
          width: this.ui_params.width, height: this.ui_params.height,
          border: this.ui_params.border,
          fb_perlin_multiplier: this.ui_params.fb_perlin_multiplier,
          fb_perlin_offset: this.ui_params.fb_perlin_offset,
          fb_feature_perlin_argument_multiplier: this.ui_params.fb_feature_perlin_argument_multiplier,
          fb_feature_exponent: this.ui_params.fb_feature_exponent,
          fb_feature_perlin_multiplier: this.ui_params.fb_feature_perlin_multiplier,
          comp_perlin_multiplier: this.ui_params.comp_perlin_multiplier,
          comp_perlin_offset: this.ui_params.comp_perlin_offset,
          comp_flat_exponent: this.ui_params.flat_exponent,
          comp_sharp_exponent: this.ui_params.sharp_exponent,
          comp_ctrl_scaleA: this.ui_params.comp_ctrl_scaleA,
          comp_ctrl_scaleB: this.ui_params.comp_ctrl_scaleB,
          comp_ctrl_weightA: this.ui_params.comp_ctrl_weightA,
          comp_steps: this.ui_params.comp_steps
        }
      );
      const new_terrain_mesh = terrain_build_mesh(height_map);
      this.resource_manager.add_procedural_mesh("mesh_terrain", new_terrain_mesh);
    }
    );

    create_slider("Comp ctrl weight A", [0, 100], (i) => {
      this.ui_params.comp_ctrl_weightA = i / 100;
      const height_map = this.procedural_texture_generator.compute_texture(
        "perlin_heightmap",
        noise_functions.Sand,
        {
          width: this.ui_params.width, height: this.ui_params.height,
          border: this.ui_params.border,
          fb_perlin_multiplier: this.ui_params.fb_perlin_multiplier,
          fb_perlin_offset: this.ui_params.fb_perlin_offset,
          fb_feature_perlin_argument_multiplier: this.ui_params.fb_feature_perlin_argument_multiplier,
          fb_feature_exponent: this.ui_params.fb_feature_exponent,
          fb_feature_perlin_multiplier: this.ui_params.fb_feature_perlin_multiplier,
          comp_perlin_multiplier: this.ui_params.comp_perlin_multiplier,
          comp_perlin_offset: this.ui_params.comp_perlin_offset,
          comp_flat_exponent: this.ui_params.flat_exponent,
          comp_sharp_exponent: this.ui_params.sharp_exponent,
          comp_ctrl_scaleA: this.ui_params.comp_ctrl_scaleA,
          comp_ctrl_scaleB: this.ui_params.comp_ctrl_scaleB,
          comp_ctrl_weightA: this.ui_params.comp_ctrl_weightA,
          comp_steps: this.ui_params.comp_steps
        }
      );
      const new_terrain_mesh = terrain_build_mesh(height_map);
      this.resource_manager.add_procedural_mesh("mesh_terrain", new_terrain_mesh);
    }
    );


    } 
}