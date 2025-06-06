import { createREGL } from "../lib/regljs_2.1.0/regl.module.js"

// UI functions
import {
  DOM_loaded_promise,
  create_button,
  create_slider,
  clear_overlay,
  create_button_with_hotkey,
  create_hotkey_action,
  toggle_overlay_visibility
} from "./cg_libraries/cg_web.js"

// Render
import { SceneRenderer } from "./render/scene_renderer.js"
import { ResourceManager } from "./scene_resources/resource_manager.js"
import { ProceduralTextureGenerator } from "./render/procedural_texture_generator.js";


// Scenes
import { TutorialScene } from "./scenes/tutorial_scene.js";
import { DemoScene } from "./scenes/demo_scene.js";
import { DoFScene } from "./scenes/dof_scene.js";
import { BoidsScene } from "./scenes/boids_scene.js";
import { SandScene } from "./scenes/sand_scene.js";
import { max } from "../lib/gl-matrix_3.3.0/esm/vec3.js";
// import { distance } from "../lib/gl-matrix_3.3.0/esm/vec3.js";

DOM_loaded_promise.then(main)

async function main() {

  /*---------------------------------------------------------------
    1. Canvas Setup
  ---------------------------------------------------------------*/

  // REGL creates their own canvas
  const regl = createREGL({
    profile: true, // Can be useful to measure the size of buffers/textures in memory
    extensions: [  // Activate some WebGL extensions to access advanced features that are not part of the core WebGL specification
      'OES_texture_float', 'OES_texture_float_linear', 'WEBGL_color_buffer_float',
      'OES_vertex_array_object', 'OES_element_index_uint', 'WEBGL_depth_texture'
    ],
  })

  // The <canvas> object (HTML element for drawing graphics) was created by REGL: we take a handle to it
  const canvas_elem = document.getElementsByTagName('canvas')[0]
  {
    // Resize canvas to fit the window
    function resize_canvas() {
      canvas_elem.width = window.innerWidth
      canvas_elem.height = window.innerHeight
    }
    resize_canvas()
    window.addEventListener('resize', resize_canvas)
  }

  /*---------------------------------------------------------------
    2. UI Setup
  ---------------------------------------------------------------*/

  /**
   * Object used to propagate parameters that the user can change in the interface.
   * Define here your parameters.
   */
  const ui_global_params = {
    is_paused: false,
    depth_of_field: false,
    minFocusDistance: 5.0,
    maxFocusDistance: 100.0,
    absorbtion_coeff: 0.04,
    scattering_coeff: 0.05,
    normalization: 0.5,
    max_step: 50,
    step_size: 0.1,
    light_strength: 5000.0,
    frequency: 0.1,
    sphere_light: 0,
    time: 0,
  }

  const ui_categories = {
    "God Rays": {
      expanded: false,
      params: [
        { label: "Max steps", key: "max_step" },
        { label: "Step size", key: "step_size" },
        { label: "Scattering Coeff", key: "scattering_coeff" },
        { label: "Absorbtion Coeff", key: "absorbtion_coeff" },
        { label: "Light Strength", key: "light_strength" },
        { label: "Normalization", key: "normalization" },
        { label: "Frequency", key: "frequency" },
        { label: "Sphere Light", key: "sphere_light" },
      ]
    },
    "Dof": {
      expanded: false,
      params: [
        { label: "Add Depth Of Field", key: "depth_of_field", type: "button" },
        { label: "Focus Distance", key: "minFocusDistance" },
        { label: "Focus Range", key: "maxFocusDistance" },
        { label: "Blur Kernel Size", key: "dof_kernel_size" }
      ]
    }
  };


  function initialize_ui_params() {

    // Bind a hotkey to hide the overlay
    create_hotkey_action("Hide overlay", "h", () => { toggle_overlay_visibility() });

    // Create a pause button
    create_hotkey_action("Pause", "p", () => {
      ui_global_params.is_paused = !ui_global_params.is_paused;
    });

    create_hotkey_action("Preset 1", "1", () => {
      ui_global_params.max_step = 50;
      ui_global_params.step_size = 0.17;
      ui_global_params.scattering_coeff = 0.05;
      ui_global_params.absorbtion_coeff = 0.04;
      ui_global_params.light_strength = 50000.0;
      ui_global_params.normalization = 0.5;
      ui_global_params.frequency = 0.05;
      ui_global_params.sphere_light = 0;
    });

    create_hotkey_action("Preset 2", "2", () => {
      ui_global_params.max_step = 50;
      ui_global_params.step_size = 0.17;
      ui_global_params.scattering_coeff = 0.025;
      ui_global_params.absorbtion_coeff = 0.045;
      ui_global_params.light_strength = 400.0;
      ui_global_params.normalization = 1.;
      ui_global_params.frequency = 0.05;
      ui_global_params.sphere_light = 1;
    });

    Object.entries(ui_categories).forEach(([catName, cat]) => {

      // Expand/collapse button
      create_button_with_hotkey(
        (cat.expanded ? "▼ " : "► ") + catName,
        "",
        () => {
          cat.expanded = !cat.expanded;
          clear_overlay();
          initialize_ui_params();
          active_scene.initialize_ui_params();
        }
      );

      if (cat.expanded) {
        cat.params.forEach(param => {
          if (param.type === "button") {
            // Only for Dof category
            create_hotkey_action(param.label, "d", () => {
              ui_global_params[param.key] = !ui_global_params[param.key];
            });
          } else {
            // Sliders for God Rays
            let max_light_strength = 100000;

            let sliderConfig = {
              "max_step": { range: [3, 200], cb: i => ui_global_params.max_step = parseInt(i) },
              "step_size": { range: [0, 100], cb: i => ui_global_params.step_size = (i / 100) * 10. },
              "scattering_coeff": { range: [0, 100], cb: i => ui_global_params.scattering_coeff = i / 100 * 0.1 },
              "absorbtion_coeff": { range: [0, 100], cb: i => ui_global_params.absorbtion_coeff = i / 100 * 0.1 },
              "light_strength": { range: [0, 100], cb: i => ui_global_params.light_strength = i / 100 * max_light_strength },
              "normalization": { range: [0, 100], cb: i => ui_global_params.normalization = i / 100 },
              "frequency": { range: [0, 1000], cb: i => ui_global_params.frequency = Math.exp(i / 100) * 0.01 },
              "sphere_light": {
                range: [0, 1], cb: i => ui_global_params.sphere_light = parseInt(i)
              },

              "minFocusDistance": { range: [0, 50], cb: i => ui_global_params.minFocusDistance = Number(i) },
              "maxFocusDistance": { range: [10, 200], cb: i => ui_global_params.maxFocusDistance = Number(i) },
            };
            let conf = sliderConfig[param.key];
            if (conf) create_slider(param.label, conf.range, conf.cb);
          }
        });
      }
    });
  }

  /*---------------------------------------------------------------
    3. Camera Listeners
  ---------------------------------------------------------------*/

  // Rotate camera position by dragging with the mouse
  canvas_elem.addEventListener('mousemove', (event) => {
    // If left or middle button is pressed
    if (event.buttons & 1) {
      active_scene.camera.rotate_action(event.movementX, event.movementY);
    }
    else if (event.buttons & 4) {
      active_scene.camera.move_action(event.movementX, event.movementY);
    }
  })

  // zoom
  canvas_elem.addEventListener('wheel', (event) => {
    active_scene.camera.zoom_action(event.deltaY);
  })

  /*---------------------------------------------------------------
    4. Resources and Scene Instantiation
  ---------------------------------------------------------------*/

  // Instantiate the resources manager
  const resource_manager = await new ResourceManager(regl).load_resources();
  const procedural_texture_generator = new ProceduralTextureGenerator(regl, resource_manager);

  // Instantiate the scene renderer, i.e. the entry point for rendering a scene
  const scene_renderer = new SceneRenderer(regl, resource_manager);

  // Instantiate scenes. Multiple different scenes can be set up here: 
  // which one is rendered depends on the value of the active_scene variable.

  const dof_scene = new DoFScene(resource_manager);

  const sand_scene = new SandScene(resource_manager, procedural_texture_generator)

  const tutorial_scene = new TutorialScene(resource_manager);

  const boids_scene = new BoidsScene(resource_manager, procedural_texture_generator);

  const active_scene = boids_scene;   // Assign the scene to be rendered to active_scene

  /*---------------------------------------------------------------
    5. UI Instantiation
  ---------------------------------------------------------------*/

  clear_overlay();
  initialize_ui_params();  // add general UI controls
  active_scene.initialize_ui_params();  // add scene-specific UI controls

  /*---------------------------------------------------------------
    6. Rendering Loop
  ---------------------------------------------------------------*/

  // Time variable
  let dt = 0;
  let prev_regl_time = 0;

  regl.frame((frame) => {
    // Reset canvas
    const background_color = [0.0, 0.0, 0.0, 1];
    regl.clear({ color: background_color });

    /*---------------------------------------------------------------
      Update the current frame data
    ---------------------------------------------------------------*/

    // Compute the time elapsed since last frame
    dt = frame.time - prev_regl_time;
    prev_regl_time = frame.time;

    // If the time is not paused, iterate over all actors and call their evolve function
    if (!ui_global_params.is_paused) {
      for (const name in active_scene.actors) {
        active_scene.actors[name].evolve(dt);
      }

      ui_global_params.time += dt;
    }

    // The scene state contains all information necessary to render the scene in this frame
    const scene_state = {
      scene: active_scene,
      frame: frame,
      background_color: background_color,
      ui_params: { ...ui_global_params, ...active_scene.ui_params },
    }

    /*---------------------------------------------------------------
      Render the scene
    ---------------------------------------------------------------*/

    scene_renderer.render(scene_state);

  })


}


