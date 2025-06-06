import { cg_mesh_make_uv_sphere, cg_mesh_make_cube } from "../cg_libraries/cg_mesh.js"
import { vec2, vec3, vec4, mat3, mat4, quat } from "../../lib/gl-matrix_3.3.0/esm/index.js"

import { TurntableCamera } from "../scene_resources/camera.js"
import { ResourceManager } from "../scene_resources/resource_manager.js";

import * as MATERIALS from "../render/materials.js"
import { Scene } from "./scene.js"
import { Material } from "../../lib/webgl-obj-loader_2.0.8/webgl-obj-loader.module.js";
import { ProceduralTextureGenerator } from "../render/procedural_texture_generator.js";
import { terrain_build_mesh } from "../scene_resources/terrain_generation.js";
import { noise_functions } from "../render/shader_renderers/noise_sr.js";


import {
  create_slider,
  create_button_with_hotkey,
  create_hotkey_action
} from "../cg_libraries/cg_web.js";

var cohesion_weight = 2.;
var alignment_weight = 2.;
var separation_weight = 2.;

export class BoidsScene extends Scene {

  /**
   * A scene featuring fish as boids
   * @param {*} resource_manager 
   */

  constructor(resource_manager, procedural_texture_generator) {

    super();

    this.resource_manager = resource_manager;
    this.procedural_texture_generator = procedural_texture_generator;

    // Scene-specific parameters that can be modified from the UI
    this.ui_params = {}

    // A list of all the objects that will be rendred on the screen
    this.objects = [];

    this.static_objects = [];
    this.dynamic_objects = [];

    // Used to handle the boids
    // A list of all the boids in the scene
    this.boids = [];
    this.boids_type = [];

    this.predators = [];

    // A set of key-value pairs, each entry represents an object that evolves with time
    this.actors = {};

    // Camera, turntable by default
    this.camera = new TurntableCamera();
    this.camera_mode = 0;

    this.old_camera_view = this.camera.mat.view;

    // Ambient light coefficient
    this.ambient_factor = 0.3;

    // Point lights
    this.lights = [];
    this.old_light_position = vec3.create();
    this.light_follow_angler = false;

    this.initialize_scene();
    this.initialize_actor_actions();
  }

  /**
   * Scene setup
   */
  initialize_scene() {

    this.resource_manager.add_procedural_mesh("skysphere", cg_mesh_make_uv_sphere(16));
    this.resource_manager.add_procedural_mesh("cube", cg_mesh_make_cube());

    //TODO make constants
    //this.boids = create_boids(200, 'fish.obj', MATERIALS.fish, 40.0);
    const fish_boids = create_boids(150, 'fish.obj', MATERIALS.fish, 40.0, [0.5, 0.5, 0.5], "fish");

    const nemo_boids = create_boids(150, 'nemo.obj', MATERIALS.nemo, 40.0, [0.01, 0.01, 0.01], "nemo");

    this.boid_types = [
      { name: "fish", boids: fish_boids },
      { name: "nemo", boids: nemo_boids }
    ];

    this.boids = fish_boids.concat(nemo_boids);


    this.predators = create_boids(1, 'angler.obj', MATERIALS.angler, 40.0);
    this.predators[0].scale = [2, 2, 2];

    /************************************************************** */
    this.ui_params.terrain_height = 80.0;
    this.ui_params.width = 256.0;
    this.ui_params.height = 256.0;
    this.ui_params.height_of_terrain = 80.0;

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
    this.TERRAIN_SCALE = [150, 150, this.ui_params.terrain_height];
    const height_map = this.procedural_texture_generator.compute_texture(
      "perlin_heightmap",
      // IF YOU WANT TO CHANGE THE NOISE YOU HAVE TO PUT noise_function.Sand (see noise_sr.js)
      noise_functions.Sand,
      {
        width: this.ui_params.width, height: this.ui_params.height,
        border: this.ui_params.border,
        fb_perlin_multiplier: this.ui_params.fb_perlin_multiplier,
        fb_perlin_offset: this.ui_params.fb_perlin_offset,
        fb_feature_perlin_argument_multiplier: this.ui_params.fb_feature_perlin_argument_multiplier,
        fb_feature_exponent: this.ui_params.fb_feature_exponent,
        fb_feature_perlin_m: this.ui_params.fb_feature_perlin_multiplier,
        comp_perlin_multiplier: this.ui_params.comp_perlin_multiplier,
        comp_perlin_offset: this.ui_params.perlin_offset,
        comp_flat_exponent: this.ui_params.flat_exponent,
        comp_sharp_exponent: this.ui_params.comp_sharp_exponent,
        comp_ctrl_scaleA: this.ui_params.comp_ctrl_scaleA,
        comp_ctrl_scaleB: this.ui_params.comp_ctrl_scaleB,
        comp_ctrl_weightA: this.ui_params.comp_ctrl_weightA,
        comp_steps: this.ui_params.comp_steps
      }
    );

    const terrain_mesh = terrain_build_mesh(height_map);
    this.resource_manager.add_procedural_mesh("mesh_terrain", terrain_mesh);

    // Change SCALE of Terrain to adapt it to size of Cube


    /********************************************************************************** */




    this.dynamic_objects.push(...this.boids);
    this.dynamic_objects.push(...this.predators);

    for (let i = 0; i < this.boids.length; i++) {
      const boid = this.boids[i];
      this.actors[`boid_${i}`] = boid;
    }
    for (let i = 0; i < this.predators.length; i++) {
      const predator = this.predators[i];
      this.actors[`predator_${i}`] = predator;
    }

    this.static_objects.push({
      translation: [0, 0, -70],
      scale: this.TERRAIN_SCALE,
      mesh_reference: 'mesh_terrain',
      material: MATERIALS.terrain,

    });

    this.static_objects.push({
      translation: [0, 0, 0],
      scale: [75., 75., 75.],
      mesh_reference: 'cube',
      material: MATERIALS.water
    });

    this.static_objects.push({
      translation: [0, 0, 0],
      scale: [250., 250., 250.],
      mesh_reference: 'skysphere',
      material: MATERIALS.underwater
    });

    this.lights.push({
      position: [0.0, 0.0, 130.],
      color: [1.0, 1.0, 0.9]
    });

    this.objects = this.static_objects.concat(this.dynamic_objects);
  }

  /**
   * Initialize the evolve function that describes the behaviour of each actor 
   */
  initialize_actor_actions() {

    for (const name in this.actors) {
      // Boids
      if (name.includes("boid")) {
        const boid = this.actors[name];
        boid.evolve = (dt) => {
          if (this.camera_mode == 3) {
            const boid_0 = this.actors['boid_0'];

            const boid_0_pos = vec3.fromValues(boid_0.translation[0], boid_0.translation[1], boid_0.translation[2]);
            const boid_direction = vec3.normalize(vec3.create(), boid_0.velocity);
            vec3.scaleAndAdd(boid_direction, boid_0_pos, boid_direction, -2.);

            this.camera.set_camera_position_and_target(boid_direction, boid_0_pos, [0, -1, 0]);
          }

          boid_evolve(boid, this.boids, this.predators[0], dt);
        }
      }
      // Predators
      else if (name.includes("predator")) {
        const predator = this.actors[name];
        predator.evolve = (dt) => {
          if (name == "predator_0") {
            if (this.camera_mode == 1) {
              const boid_0 = this.actors['predator_0'];

              const boid_0_pos = vec3.fromValues(boid_0.translation[0], boid_0.translation[1], boid_0.translation[2]);
              const boid_direction = vec3.normalize(vec3.create(), boid_0.velocity);
              vec3.scaleAndAdd(boid_direction, boid_0_pos, boid_direction, 30.);

              this.camera.set_camera_position_and_target(boid_direction, boid_0_pos, [0, -1, 0]);
            }

            if (this.camera_mode == 2) {
              const boid_0 = this.actors['predator_0'];

              const boid_0_pos = vec3.fromValues(boid_0.translation[0], boid_0.translation[1], boid_0.translation[2]);
              const boid_direction = vec3.normalize(vec3.create(), boid_0.velocity);
              vec3.scaleAndAdd(boid_direction, boid_0_pos, boid_direction, -30.);

              this.camera.set_camera_position_and_target(vec3.create(), boid_0_pos, [0, 0, 1.]);
            }
          }

          predator_evolve(predator, this.boids, dt);

          if (this.light_follow_angler) {
            const predator_dir = vec3.normalize(vec3.create(), predator.velocity);
            this.lights[0].position[0] = predator.translation[0] + predator_dir[0] * 5;
            this.lights[0].position[1] = predator.translation[1] + predator_dir[1] * 5;
            this.lights[0].position[2] = predator.translation[2] + predator_dir[2] * 5;
          }
        }
      }
    }
  }
  /**
   * Initialize custom scene-specific UI parameters to allow interactive control of selected scene elements.
   * This function is called in main() if the scene is active.
   */
  initialize_ui_params() {

    create_button_with_hotkey("Change camera mode", "f", () => {
      this.camera_mode = (this.camera_mode + 1) % 4;

      console.log(this.camera_mode);
      // save old camera view to reuse once changed
      if (this.camera_mode == 1) {
        this.old_camera_view = {
          distance_factor: this.camera.distance_factor,
          angle_y: this.camera.angle_y,
          angle_z: this.camera.angle_z,
          look_at: this.camera.look_at.slice(),
        };
      }
      else if (this.camera_mode == 0) {
        this.camera.set_preset_view(this.old_camera_view);
      }
    });


    const min_obj_dim = 0;
    const max_obj_dim = 256;

    create_slider("Dimension of Terrain", [min_obj_dim, max_obj_dim], (value) => {
      this.ui_params.height = value;
      this.ui_params.width = value;
      const height_map = this.procedural_texture_generator.compute_texture(
        "perlin_heightmap",
        noise_functions.Sand,
        {
          width: this.ui_params.width, height: this.ui_params.height,
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

    create_slider("Boids cohesion", [0, 100], (i) => {
      cohesion_weight = i / 10.;
    });

    create_slider("Boids alignment", [0, 100], (i) => {
      alignment_weight = i / 10.;
    });

    create_slider("Boids separation", [0, 100], (i) => {
      separation_weight = i / 10.;
    })

    create_slider("Vertical span of Terrain", [0, 100], (i) => {
      this.ui_params.terrain_height = i;
      this.TERRAIN_SCALE[2] = this.ui_params.terrain_height;

    });

    //create_slider()
    create_slider("Border", [-10, 10], (i) => {
      console.log(i);
      this.ui_params.border = parseFloat(i) / 10.0;
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
    },);

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






    create_button_with_hotkey("Light follow anlger", "g", () => {
      this.light_follow_angler = !this.light_follow_angler;

      if (this.light_follow_angler) {
        this.old_light_position = this.lights[0].position.slice();
      }
      else {
        this.lights[0].position = this.old_light_position.slice();
      }
    });

  }
}

function create_boids(num_boids, mesh_reference, material, box_size, scale, type) {
  const boids = [];
  for (let i = 0; i < num_boids; i++) {
    const velocity = vec3.fromValues(Math.random() - 1, Math.random() - 1, Math.random() - 1);

    // Make object look in the direction of the velocity vector
    const rotation = quat.rotationTo(quat.create(), [0, 0, 1], vec3.normalize(vec3.create(), velocity));

    const boid = {
      translation: vec3.fromValues(Math.random() * box_size - box_size / 2, Math.random() * box_size - box_size / 2, Math.random() * box_size - box_size / 2),
      //translation: vec3.fromValues(5, 5, 5),
      rotation_eulers: vec3.create(),
      rotation: rotation,
      velocity: velocity,
      acceleration: vec3.create(),
      scale: scale ? scale.slice() : [1, 1, 1],
      mesh_reference: mesh_reference,
      material: material,
      type: type || "fish"
    };
    boids.push(boid);
  }

  return boids;
}

function get_to_scale(scale, max_scale, dt, speed) {
  const scale_factor = Math.min(max_scale, scale[0] + dt * speed);
  return [scale_factor, scale_factor, scale_factor];
}

function get_cohesion_alignment_separation(boid, boids, max_distance, separation_distance) {
  const cohesion = vec3.create();
  const alignment = vec3.create();
  const separation = vec3.create();
  var count = 0;

  for (let i = 0; i < boids.length; i++) {
    const other_boid = boids[i];
    const distance = vec3.distance(boid.translation, other_boid.translation);

    // TODO: make view distance a constant
    if (other_boid != boid && distance < max_distance) {
      vec3.add(cohesion, cohesion, other_boid.translation);

      vec3.add(alignment, alignment, vec3.normalize(vec3.create(), other_boid.velocity));

      // TODO: make separation distance a constant
      if (distance < separation_distance) {

        const temp_separation = vec3.create();

        vec3.sub(temp_separation, boid.translation, other_boid.translation);
        vec3.normalize(temp_separation, temp_separation);
        vec3.scale(temp_separation, temp_separation, 1.0 / distance);

        vec3.add(separation, separation, temp_separation);
      }

      count++;
    }
  }

  if (count == 0) {
    return [vec3.create(), vec3.create(), vec3.create()];
  }

  vec3.scale(cohesion, cohesion, 1 / count);

  vec3.sub(cohesion, cohesion, boid.translation);
  vec3.normalize(cohesion, cohesion);

  vec3.sub(alignment, alignment, boid.velocity);
  vec3.normalize(alignment, alignment);

  //vec3.normalize(separation, separation);

  return [cohesion, alignment, separation];
}

function get_wall_avoidance(boid, margin, box_size) {
  const wall_avoidance = vec3.create();

  const x_min = -box_size / 2;
  const x_max = box_size / 2;
  const y_min = -box_size / 2;
  const y_max = box_size / 2;
  const z_min = -box_size / 2;
  const z_max = box_size / 2;

  if (boid.translation[0] > x_max - margin) {
    wall_avoidance[0] = -Math.exp(Math.abs((x_max - margin) - boid.translation[0]));
  } else if (boid.translation[0] < x_min + margin) {
    wall_avoidance[0] = Math.exp(Math.abs((x_min + margin) - boid.translation[0]));
  }
  if (boid.translation[1] > y_max - margin) {
    wall_avoidance[1] = -Math.exp(Math.abs((y_max - margin) - boid.translation[1]));
  } else if (boid.translation[1] < y_min + margin) {
    wall_avoidance[1] = Math.exp(Math.abs((y_min + margin) - boid.translation[1]));
  }
  if (boid.translation[2] > z_max - margin) {
    wall_avoidance[2] = -Math.exp(Math.abs((z_max - margin) - boid.translation[2]));
  } else if (boid.translation[2] < z_min + margin) {
    wall_avoidance[2] = Math.exp(Math.abs((z_min + margin) - boid.translation[2]));
  }

  return wall_avoidance;
}

function get_center_attraction(boid) {
  const center_attraction = vec3.create();
  const center = vec3.fromValues(0, 0, 0);
  vec3.sub(center_attraction, center, boid.translation);
  return center_attraction;
}

const max_distance = 8.0;
const separation_distance = 2.0;

const center_attraction_weight = .1;
const wall_avoidance_weight = 100.0;
const wall_margin = 5.0;
const box_size = 150.0;

const max_speed = 20.0;
const min_speed = 5.0;

const max_scale = .5;
const scale_speed = 0.1;

function boid_evolve(boid, boids, predator, dt) {

  // Nice little scale animation that plays in the beginning
  boid.scale = get_to_scale(boid.scale, max_scale, dt, scale_speed);

  // calculate effects on velocity
  const acc = get_cohesion_alignment_separation(boid, boids, max_distance, separation_distance);
  const cohesion = acc[0];
  const alignment = acc[1];
  const separation = acc[2];
  const wall_avoidance = get_wall_avoidance(boid, wall_margin, box_size);
  const center_attraction = get_center_attraction(boid);

  // TODO: make weights constants
  // Add weighted effects to velocity
  vec3.scale(cohesion, cohesion, cohesion_weight);
  vec3.scale(separation, separation, separation_weight);
  vec3.scale(alignment, alignment, alignment_weight);
  vec3.scale(wall_avoidance, wall_avoidance, wall_avoidance_weight);
  vec3.scale(center_attraction, center_attraction, center_attraction_weight);

  vec3.scale(boid.acceleration, boid.acceleration, 0.0);
  vec3.add(boid.acceleration, boid.acceleration, cohesion);
  vec3.add(boid.acceleration, boid.acceleration, separation);
  vec3.add(boid.acceleration, boid.acceleration, alignment);
  vec3.add(boid.acceleration, boid.acceleration, wall_avoidance);
  vec3.add(boid.acceleration, boid.acceleration, center_attraction);

  // Predator Avoidance
  const avoid_predator = vec3.create();
  const predator_distance = vec3.distance(boid.translation, predator.translation);
  const avoid_predator_radius = 15.0; // distance at which boids start to avoid
  if (predator_distance < avoid_predator_radius) {
    vec3.sub(avoid_predator, boid.translation, predator.translation);
    vec3.normalize(avoid_predator, avoid_predator);
    vec3.scale(avoid_predator, avoid_predator, 1000.0 * (1.0 - predator_distance / avoid_predator_radius));
    vec3.add(boid.acceleration, boid.acceleration, avoid_predator);
  }

  //vec3.normalize(boid.acceleration, boid.acceleration);
  vec3.scale(boid.acceleration, boid.acceleration, dt);

  // Add acceleration to velocity
  vec3.add(boid.velocity, boid.velocity, boid.acceleration);


  // Limit max speed
  if (vec3.length(boid.velocity) > max_speed) {
    vec3.normalize(boid.velocity, boid.velocity);
    vec3.scale(boid.velocity, boid.velocity, max_speed);
  }

  // Limit min speed
  if (vec3.length(boid.velocity) < min_speed) {
    vec3.normalize(boid.velocity, boid.velocity);
    vec3.scale(boid.velocity, boid.velocity, min_speed);
  }

  boid.rotation = quat.create();
  quat.rotationTo(boid.rotation, [0, 0, 1], vec3.normalize(vec3.create(), boid.velocity));

  // Move boids in velocity direction
  boid.translation[0] += boid.velocity[0] * dt;
  boid.translation[1] += boid.velocity[1] * dt;
  boid.translation[2] += boid.velocity[2] * dt;
}

function predator_evolve(predator, boids, dt) {
  // Nice little scale animation that plays in the beginning
  predator.scale = get_to_scale(predator.scale, max_scale, dt, scale_speed);


  // calculate effects on velocity
  const acc = get_cohesion_alignment_separation(predator, boids, 12., separation_distance);
  const cohesion = acc[0];
  const alignment = acc[1];
  const wall_avoidance = get_wall_avoidance(predator, wall_margin, box_size);
  const center_attraction = get_center_attraction(predator);

  vec3.scale(cohesion, cohesion, 5.);
  vec3.scale(alignment, alignment, 3.);
  vec3.scale(wall_avoidance, wall_avoidance, wall_avoidance_weight);
  vec3.scale(center_attraction, center_attraction, 3 * center_attraction_weight);

  vec3.scale(predator.acceleration, predator.acceleration, 0.0);
  vec3.add(predator.acceleration, predator.acceleration, cohesion);
  vec3.add(predator.acceleration, predator.acceleration, alignment);
  vec3.add(predator.acceleration, predator.acceleration, wall_avoidance);
  vec3.add(predator.acceleration, predator.acceleration, center_attraction);

  vec3.scale(predator.acceleration, predator.acceleration, dt);

  // Add acceleration to velocity
  vec3.add(predator.velocity, predator.velocity, predator.acceleration);

  // Limit max speed
  if (vec3.length(predator.velocity) > max_speed) {
    vec3.normalize(predator.velocity, predator.velocity);
    vec3.scale(predator.velocity, predator.velocity, max_speed);
  }

  // Limit min speed
  if (vec3.length(predator.velocity) < min_speed) {
    vec3.normalize(predator.velocity, predator.velocity);
    vec3.scale(predator.velocity, predator.velocity, min_speed);
  }

  predator.rotation = quat.create();
  quat.rotationTo(predator.rotation, [0, 0, 1], vec3.normalize(vec3.create(), predator.velocity));

  // Move predators in velocity direction
  predator.translation[0] += predator.velocity[0] * dt;
  predator.translation[1] += predator.velocity[1] * dt;
  predator.translation[2] += predator.velocity[2] * dt;
}