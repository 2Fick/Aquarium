import { vec2, vec3, vec4, mat3, mat4 } from "../../lib/gl-matrix_3.3.0/esm/index.js"
import { ResourceManager } from "../scene_resources/resource_manager.js"
import { vec3FromVec4, vec4FromVec3 } from "./cg_math.js"


/**
 * Helper function to compute light position in camera view space
 * @param {*} light_position the position of the light [x,y,z]
 * @param {*} cam_mat_view the camera view matrix
 * @returns 
 */
export function light_to_cam_view(light_position, cam_mat_view){
    let light_position_cam = vec4.create()
    vec4.transformMat4(light_position_cam, vec4FromVec3(light_position, 1.0), cam_mat_view)
    light_position_cam = vec3FromVec4(light_position_cam)
    return light_position_cam
}


/**
 * Helper function to get the object texture and if it is texture or not
 * @param {*} obj the object for which to get the texture data
 * @param {ResourceManager} resource_manager 
 * @returns 
 */
export function texture_data(obj, resource_manager){

    // If the object doesn't use a texture, then return a default texture to avoid pipeline 
    // error even if it is not used in the render computation
    if(!obj.material.texture){
        let texture = resource_manager.get_texture("pine.png");
        let is_textured = false
        return {texture, is_textured}
    }

    let texture = resource_manager.get_texture(obj.material.texture);
    let is_textured = true
    
    return {texture, is_textured}
}


