

import { TurntableCamera } from "../scene_resources/camera.js"
import { ResourceManager } from "../scene_resources/resource_manager.js";


export class Scene {
  /**
   * Create a scene object that can be passed to a SceneRenderer to be displayed on the screen
   */
  constructor() {

    // Scene-specific parameters that can be modified from the UI
    this.ui_params = {}

    // A list of all the objects that will be rendred on the screen
    this.objects = [];

    // A set of key-value pairs, each entry represents an object that evolves with time
    this.actors = {};
    
    // Camera, turntable by default
    this.camera = new TurntableCamera();

    // Ambient light coefficient
    this.ambient_factor = 0.3;

    // Point lights
    this.lights = [];
  }

  /**
   * Scene setup
   */
  initialize_scene() {}

  /**
   * Initialize the evolve function that describes the behaviour of each actor 
   */
  initialize_actor_actions() {}

  /**
   * Initialize custom scene-specific UI parameters to allow interactive control of selected scene elements.
   * This function is called in main() if the scene is active.
   */
  initialize_ui_params() {}
}