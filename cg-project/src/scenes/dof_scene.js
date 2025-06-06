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

export class DoFScene extends Scene {

  /**
   * A scene to be completed, used for the introductory tutorial
   * @param {ResourceManager} resource_manager 
   */
  constructor(resource_manager){
    super();

    this.resource_manager = resource_manager;

    // Initialize phase tracker for animations
    this.phase = 0;
    
    this.initialize_scene();
    this.initialize_actor_actions();
  }

  /**
   * Scene setup
   */
  initialize_scene(){
    // Add a light source
    this.lights.push({
        position: [0.0, -50.0, 20.0],
        color: [1.0, 1.0, 0.9],
    });

    // Initialize static and dynamic objects lists
    this.static_objects = [];
    this.dynamic_objects = [];

    //Add a boolean to track the mirror effect state
    this.ui_params = {
        is_mirror_active: true,
    };

    // Create the Suzanne object
    const suzanne = {
        translation: [0, 0, 0], // Position of the object
        scale: [1, 1, 1],       // Scale of the object
        mesh_reference: 'suzanne.obj', // Reference to the loaded mesh
        material: MATERIALS.blue,     // Assign a valid material
    };

    const background = {
        translation: [0, 0, 0], // Position of the object
        scale: [1, 1, 1],       // Scale of the object
        mesh_reference: 'dof.obj', // Reference to the loaded mesh
        material: MATERIALS.gray,     // Assign a valid material
    };

    // Add Suzanne to the static objects list
    this.static_objects.push(suzanne);
    this.static_objects.push(background);

    // Generate the skysphere mesh
    const skysphere_mesh = cg_mesh_make_uv_sphere(16);

    // Add the skysphere mesh to the ResourceManager
    this.resource_manager.add_procedural_mesh('mesh_skysphere', skysphere_mesh);

    // Create the skysphere object
    const skysphere = {
        translation: [0, 0, 0], // Centered at the origin
        scale: [80.0, 80.0, 80.0], // Large enough to surround the scene
        mesh_reference: 'mesh_skysphere', // Reference to the skysphere mesh
        material: MATERIALS.sunset_sky, // Assign the sunset_sky material
    };

    // Add the skysphere to the static objects list
    this.static_objects.push(skysphere);

    // Combine static and dynamic objects into one array
    this.objects = this.static_objects.concat(this.dynamic_objects);

    // Add lights to the actors list for UI control
    this.lights.forEach((light, i) => {
        this.actors[`light${i}`] = light;
    });

    // Add Suzanne to the actors list
    this.actors['suzanne'] = suzanne;

    // Add the skysphere to the actors list
    this.actors['skysphere'] = skysphere;
  }

  /**
   * Initialize the evolve function that describes the behaviour of each actor 
   */
  initialize_actor_actions(){
    // Local phase tracker for Suzanne's animation
    this.phase = 0;

    // Iterate over all actors
    for (const name in this.actors) {
        // Check if the actor is Suzanne
        if (name === 'suzanne') {
            this.actors[name].evolve = (dt) => {
                const frequency = 0.25; // Oscillations per second
                this.phase += dt * 2 * Math.PI * frequency;
                this.phase %= 2 * Math.PI;

                const grow_factor = 0.2;
                const scale_new = 1 + Math.cos(this.phase) * grow_factor;
                this.actors[name].scale = [scale_new, scale_new, scale_new];

                //Update the translation of Suzanne based on the UI parameter
                this.actors[name].translation[2] = this.ui_params.obj_height;
            };
        } else {
            // For other actors, ensure evolve is defined as a no-op
            this.actors[name].evolve = () => {};
        }
    }
  }

  /**
   * Initialize custom scene-specific UI parameters to allow interactive control of selected scene elements.
   * This function is called in main() if the scene is active.
   */
  initialize_ui_params(){

      // Initialize UI parameters
      this.ui_params = {
        obj_height: 0, // Default vertical displacement
    };

    // Set preset view
    create_hotkey_action("Preset view", "1", () => {
        this.camera.set_preset_view({
            distance_factor: 1.5,
            angle_z: -Math.PI / 2 - 0.3,
            angle_y: .1,
            look_at: [10, -10, 0],
        });
    });

    // Create a slider to change Suzanne's height
    const n_steps_slider = 100;
    const min_obj_height = 0;
    const max_obj_height = 1;
    create_slider("Suzanne's position ", [0, n_steps_slider], (i) => {
        this.ui_params.obj_height = min_obj_height + i * (max_obj_height - min_obj_height) / n_steps_slider;
    });

    //create a button to toggle the mirror effect
    create_button_with_hotkey("Mirror on/off", "m", () => {
      this.ui_params.is_mirror_active = !this.ui_params.is_mirror_active;
    });
  }
}