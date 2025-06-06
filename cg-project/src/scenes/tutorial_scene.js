
import { TurntableCamera } from "../scene_resources/camera.js"
import * as MATERIALS from "../render/materials.js"
import { cg_mesh_make_uv_sphere } from "../cg_libraries/cg_mesh.js"

import { 
  create_slider, 
  create_button_with_hotkey, 
  create_hotkey_action 
} from "../cg_libraries/cg_web.js";
import { Scene } from "./scene.js";
import { ResourceManager } from "../scene_resources/resource_manager.js";
import { Material } from "../../lib/webgl-obj-loader_2.0.8/webgl-obj-loader.module.js";

export class TutorialScene extends Scene {

  /**
   * A scene to be completed, used for the introductory tutorial
   * @param {ResourceManager} resource_manager 
   */
  constructor(resource_manager){
    super();
    
    this.resource_manager = resource_manager;

    this.static_objects = [];
    this.dynamic_objects = [];

    this.initialize_scene();
    this.initialize_actor_actions();
  }

  /**
   * Scene setup
   */
  initialize_scene(){

    // TODO

    /*
    Define a new object in the initialize_scene() function.
    An object is essentially a list of attributes. One of the attributes is the object’s mesh:
    assign the mesh loaded from file to the object.
    */
    this.lights.push({
      position : [0.0 , -8.0, 3.0],
      color: [1.0, 1.0, 0.9]
    });

    

    const mesh = cg_mesh_make_uv_sphere(16)
    this.resource_manager.add_procedural_mesh("mesh_sphere_env_map", mesh);


    this.static_objects.push({
      translation: [0, 0, 0],
      scale: [80., 80., 80.],
      mesh_reference: 'mesh_sphere_env_map',
      material: MATERIALS.sunset_sky
    });

    this.ui_params.obj_height = 0
    this.ui_params.is_mirror_active = true
    this.ui_params.rendering_normals = false
    
    this.static_objects.push({
      translation: [0, 0, this.ui_params.obj_height],
      scale: [5, 5, 5],
      rotation: [Math.PI, Math.PI/2, Math.PI],
      mesh_reference: "suzanne.obj",       // the name you used in meshes_to_load()
      material: MATERIALS.mirror_material
    
    });
    
    this.objects = this.static_objects.concat(this.dynamic_objects);
    

    this.static_objects.forEach((object) => {
      if(object.mesh_reference == "suzanne.obj"){
        this.actors["suzanne"] = object;
      }
    })
  }

  /**
   * Initialize the evolve function that describes the behaviour of each actor 
   */
  initialize_actor_actions(){

    // TODO

    this.phase = 0;  // local phase tracker

    this.actors["suzanne"].evolve = (dt) => {

      // Advance phase using dt (control speed via frequency)
      const frequency = 0.25; // oscillations per second
      this.phase += dt * 2 * Math.PI * frequency;

      // Keep phase in [0, 2π] to avoid overflow
      this.phase %= 2 * Math.PI;

      // Procedurally animate the object
      const grow_factor = 0.2;
      const scale_new = 1 + Math.cos(this.phase) * grow_factor;
      this.actors["suzanne"].scale = [scale_new, scale_new, scale_new];

      const height = this.ui_params.obj_height ?? 0;
      const current_pos = this.actors["suzanne"].translation;
      this.actors["suzanne"].translation = [current_pos[0], current_pos[1], height];
      

    };
    
  }

  /**
   * Initialize custom scene-specific UI parameters to allow interactive control of selected scene elements.
   * This function is called in main() if the scene is active.
   */
  initialize_ui_params(){

    create_hotkey_action("View Preset", "1", ()=>{
      this.camera.set_preset_view({
        distance_factor : 0.2,
        angle_z : -Math.PI / 2,
        angle_y : 0,
        look_at : [0, 0, 0]
      })
    })

    // Create a slider to change the object height
    const n_steps_slider = 100;
    const min_obj_height = 0;
    const max_obj_height = 1;
    create_slider("Suzanne's position ", [0, n_steps_slider], (i) => {
      this.ui_params.obj_height = min_obj_height + i * (max_obj_height - min_obj_height) / n_steps_slider;
    });

    create_button_with_hotkey("Mirror on/off", "m", ()=>{
      this.ui_params.is_mirror_active = !this.ui_params.is_mirror_active;
    })

    create_button_with_hotkey("Normals on/off", "n", ()=>{
      this.ui_params.rendering_normals = !this.ui_params.rendering_normals;
    } )

    // TODO

  }

}
