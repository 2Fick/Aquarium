import { vec2, vec3, vec4, mat3, mat4, quat } from "../../lib/gl-matrix_3.3.0/esm/index.js"
import { deg_to_rad, mat4_to_string, vec_to_string, mat4_matmul_many } from "../cg_libraries/cg_math.js"

/**
 * Create a new turntable camera
 */
export class TurntableCamera {

    constructor() {
        this.angle_z = Math.PI * 0.2; // in radians!
        this.angle_y = -Math.PI / 6; // in radians!
        this.distance_factor = 1.;
        this.distance_base = 15.;
        this.look_at = [0, 0, 0];

        this.mat = {
            projection: mat4.create(),
            view: mat4.create()
        }

        this.update_format_ratio(100, 100);
        this.update_cam_transform();

    }

    /**
     * Recompute the camera perspective matrix based on the new ratio
     * @param {*} width the width of the canvas
     * @param {*} height the heigth of the canvas
     */
    update_format_ratio(width, height) {
        mat4.perspective(this.mat.projection,
            deg_to_rad * 60, // fov y
            width / height, // aspect ratio
            0.01, // near
            512, // far
        )
    }

    /**
     * Recompute the view matrix (mat.view)
     */
    update_cam_transform() {
        const r = this.distance_base * this.distance_factor;

        const M_look_forward_X = mat4.lookAt(mat4.create(),
            [-r, 0, 0], // camera position in world coord
            this.look_at, // view target point
            [0, 0, 1], // up vector
        )

        const M_rot_y = mat4.fromYRotation(mat4.create(), this.angle_y)
        const M_rot_z = mat4.fromZRotation(mat4.create(), this.angle_z)
        mat4_matmul_many(this.mat.view, M_look_forward_X, M_rot_y, M_rot_z);
    }

    /**
     * Compute all the objects transformation matrices and store them into the camera
     * (For improved performance, objects' transformation matrices are computed once at the 
     * beginning of every frame and are stored in the camera for shader_renderers to use)
     * @param {*} scene_objects 
     */
    compute_objects_transformation_matrices(scene_objects) {
        this.object_matrices = new Map();

        // Compute and store the objects matrices
        for (const obj of scene_objects) {
            const transformation_matrices = this.compute_transformation_matrices(obj);
            this.object_matrices.set(obj, transformation_matrices);
        }
    }

    /**
     * Compute the transfortmation matrix of the object for this camera
     * @param {*} object 
     * @returns 
     */
    compute_transformation_matrices(object) {
        const mat_projection = this.mat.projection;
        const mat_view = this.mat.view;

        // Construct mat_model_to_world from translation and scale.
        // If we wanted to have a rotation too, we could use mat4.fromRotationTranslationScale.
        const mat_model_to_world = mat4.create();

        if (object.hasOwnProperty("rotation") && object.rotation != undefined) {
            mat4.fromRotationTranslationScale(mat_model_to_world, object.rotation, object.translation, object.scale);
        }
        else {
            mat4.fromTranslation(mat_model_to_world, object.translation);
            mat4.scale(mat_model_to_world, mat_model_to_world, object.scale);
        }

        const mat_model_view = mat4.create();
        const mat_model_view_projection = mat4.create();
        const mat_normals_model_view = mat3.create();

        // Compute mat_model_view, mat_model_view_projection, mat_normals_model_view.
        mat4_matmul_many(mat_model_view, mat_view, mat_model_to_world);
        mat4_matmul_many(mat_model_view_projection, mat_projection, mat_model_view);

        // Recall that the transform matrix model_view for normal projection
        // is the inverted transpose of the vertices model_view.
        mat3.identity(mat_normals_model_view);
        mat3.fromMat4(mat_normals_model_view, mat_model_view);
        mat3.invert(mat_normals_model_view, mat_normals_model_view);
        mat3.transpose(mat_normals_model_view, mat_normals_model_view);

        // Note: to optimize we could compute mat_view_projection = mat_projection * mat_view 
        // only once instead as for every object. This option is simpler, and the performance
        // difference is negligible for a moderate number of objects.
        // Consider optimizing this routine if you need to render thousands of distinct objects.
        return { mat_model_view, mat_model_view_projection, mat_normals_model_view, mat_model_to_world, }
    }

    //// UI USEFUL FUNCTIONS

    /**
     * Place the camera in the defined view
     * @param {{distance_factor, angle_z, angle_y, look_at}} view 
     */
    set_preset_view(view) {
        this.distance_factor = view.distance_factor;
        this.angle_z = view.angle_z;
        this.angle_y = view.angle_y;
        this.look_at = view.look_at;
        this.update_cam_transform();
    }

    /**
     * Helper function to get in the console the state of 
     * the camera to define a preset view
     */
    log_current_state() {
        console.log(
            "distance_factor: " + this.distance_factor,
            "angle_z: " + this.angle_z,
            "angle_y: " + this.angle_y,
            "look_at " + this.look_at,
        );
    }

    /**
     * Update the camera distance_factor to produce a zoom in / zoom out effect
     * @param {*} deltaY the variation
     */
    zoom_action(deltaY) {
        const factor_mul_base = 1.18;
        const factor_mul = (deltaY > 0) ? factor_mul_base : 1. / factor_mul_base;
        this.distance_factor *= factor_mul;
        this.distance_factor = Math.max(0.02, Math.min(this.distance_factor, 15.));

        this.update_cam_transform();
    }

    /**
     * Update the camera angle to make it rotate around its look_at point
     * @param {*} movementX 
     * @param {*} movementY 
     */
    rotate_action(movementX, movementY) {
        this.angle_z += movementX * 0.003;
        this.angle_y += -movementY * 0.003;

        this.update_cam_transform();
    }

    /**
     * Moves the camera look_at point
     * @param {*} movementX 
     * @param {*} movementY 
     */
    move_action(movementX, movementY) {
        const scaleFactor = this.distance_base * this.distance_factor * 0.0005; // Adjust movement speed 

        const right = [
            Math.sin(this.angle_z),
            Math.cos(this.angle_z),
            0
        ];

        const up = [
            -Math.cos(this.angle_z) * Math.sin(this.angle_y),
            Math.sin(this.angle_z) * Math.sin(this.angle_y),
            Math.cos(this.angle_y)
        ];

        this.look_at[0] += right[0] * movementX * scaleFactor + up[0] * movementY * scaleFactor;
        this.look_at[1] += right[1] * movementX * scaleFactor + up[1] * movementY * scaleFactor;
        this.look_at[2] += up[2] * movementY * scaleFactor;

        this.update_cam_transform();
    }

    /**
     * Place the camera at a specific world position and make it look at a target point.
     * This bypasses the turntable logic and manually sets the view matrix.
     * @param {vec3} position - The world position of the camera.
     * @param {vec3} target - The point in space the camera should look at.
     * @param {vec3} [up=[0,0,1]] - The up direction (default is Z-up).
     */
    set_camera_position_and_target(position, target, up = [0, 0, 1]) {
        this.look_at = target.slice(); // Save the new look_at target
        mat4.lookAt(this.mat.view, position, target, up);

        // Optionally override distance_factor and angles if you want to "sync" turntable logic
        const offset = vec3.create();
        vec3.sub(offset, position, target);
        this.distance_factor = vec3.length(offset) / this.distance_base;

        // Extract approximate spherical angles for the turntable controls
        const dir = vec3.normalize(vec3.create(), offset);
        this.angle_y = Math.asin(dir[2]); // asin(z)
        this.angle_z = Math.atan2(dir[0], dir[1]); // atan2(x, y)
    }

    /**
     * Get the current camera position in world coordinates
     * @returns {vec3} The camera position in world coordinates.
     */
    get_camera_position() {
        // invert view matrix to get camera position
        const inv_view = mat4.create();
        mat4.invert(inv_view, this.mat.view);
        const camera_position = vec4.create();
        vec4.transformMat4(camera_position, [0, 0, 0, 1], inv_view);
        // Convert to vec3 and return
        return vec3.fromValues(camera_position[0], camera_position[1], camera_position[2]);
    }

}