

function get_vert(mesh, vert_id) {
  const offset = vert_id*3
  return  mesh.vertex_positions.slice(offset, offset+3)
}

function compute_triangle_normals_and_angle_weights(mesh) {

  /** #TODO GL2.1.1: 
  - compute the normal vector to each triangle in the mesh
  - push it into the array `tri_normals`
  - compute the angle weights for vert1, vert2, then vert3 and store it into an array [w1, w2, w3]
  - push this array into `angle_weights`

  Hint: you can use `vec3` specific methods such as `normalize()`, `add()`, `cross()`, `angle()`, or `subtract()`.
      The absolute value of a float is given by `Math.abs()`.
  */

  const num_faces     = (mesh.faces._elements.vertCount / 3) | 0
  console.log("NAME :"+mesh.name)
  console.log("LENGTH :"+ mesh.faces._elements.vertCount);
  console.log("Faces : " + mesh.faces._elements);
  console.log("Normaux : "+ mesh.vertex_positions._core);
  const tri_normals   = []
  const angle_weights = []
  for(let i_face = 0; i_face < num_faces; i_face++) {
    const vert1 = get_vert(mesh, mesh.faces._elements[3*i_face + 0])
    const vert2 = get_vert(mesh, mesh.faces._elements[3*i_face + 1])
    const vert3 = get_vert(mesh, mesh.faces._elements[3*i_face + 2])
    
    //Triangle normal computation
    const e12 = vec3.subtract(vec3.create(), vert2, vert1)
    const e13 = vec3.subtract(vec3.create(), vert3, vert1)
    const normal = vec3.cross(vec3.create(), e12, e13)
    vec3.normalize(normal, normal)

    // Angle weights computation
    // Vertex 1: angle between e12 and e13
    // Am i supposed to use absolute value here?
    // const angle1 = Math.abs(vec3.angle(e12, e13))?
    const angle1 = vec3.angle(e12, e13)

    // Vertex 2: angle between e23 and e21
    const e21 = vec3.subtract(vec3.create(), vert1, vert2)
    const e23 = vec3.subtract(vec3.create(), vert3, vert2)
    const angle2 = vec3.angle(e23, e21)

    // Vertex 3: angle between e31 and e32
    const e31 = vec3.subtract(vec3.create(), vert1, vert3)
    const e32 = vec3.subtract(vec3.create(), vert2, vert3)
    const angle3 = vec3.angle(e31, e32)

    tri_normals.push([normal[0], normal[1], normal[2]])
    angle_weights.push([angle1, angle2, angle3])
  }
  return [tri_normals, angle_weights]
}

function compute_vertex_normals(mesh, tri_normals, angle_weights) {

  /** #TODO GL2.1.2: 
  - go through the triangles in the mesh
  - add the contribution of the current triangle to its vertices' normal
  - normalize the obtained vertex normals
  */

  const num_faces    = (mesh.faces._elements.length / 3) | 0
  const num_vertices = (mesh.vertex_positions.length / 3) | 0
  const vertex_normals = Array.from({length: num_vertices}, () => vec3.create() ) // create vec3 arrays instead of [0,0,0]

  for(let i_face = 0; i_face < num_faces; i_face++) {
    const iv1 = mesh.faces._elements[3*i_face + 0]
    const iv2 = mesh.faces._elements[3*i_face + 1]
    const iv3 = mesh.faces._elements[3*i_face + 2]

    const normal = tri_normals[i_face]
    const weights = angle_weights[i_face] //angle  [w1, w2, w3]

    // weight contributution of an opening angle of the triangle
    const weight1 = vec3.scale(vec3.create(), normal, weights[0])
    const weight2 = vec3.scale(vec3.create(), normal, weights[1])
    const weight3 = vec3.scale(vec3.create(), normal, weights[2])


    // add the correct contribution to the vertex normals
    vec3.add(vertex_normals[iv1], vertex_normals[iv1], weight1)
    vec3.add(vertex_normals[iv2], vertex_normals[iv2], weight2)
    vec3.add(vertex_normals[iv3], vertex_normals[iv3], weight3)

  }

  for(let i_vertex = 0; i_vertex < num_vertices; i_vertex++) {
    // Normalize the vertices

    vec3.normalize(vertex_normals[i_vertex], vertex_normals[i_vertex])
  }

  return vertex_normals
}

export function mesh_preprocess(regl, mesh) {
  const [tri_normals, angle_weights] = compute_triangle_normals_and_angle_weights(mesh);
  console.log("TRI NORMALS : " + tri_normals);
      
  const vertex_normals = compute_vertex_normals(mesh, tri_normals, angle_weights);
  // Flatten the original vertex positions into a Float32Array:
  // (if mesh.vertex_positions was already a flat Float32Array
  // you can skip this step and use it directly)
  // Finally, buffer _that_ data exactly once:
  console.log(mesh)
  mesh.vertex_position = mesh.vertex_positions;
  mesh.vertex_normal   = vertex_normals;
  mesh.faces = mesh.faces;
  
  return mesh;
}


import { ShaderRenderer } from "./shader_renderer.js";

export class NormalsShaderRenderer extends ShaderRenderer  {
  constructor(regl, resource_manager){
    super(regl, resource_manager,
          "normals.vert.glsl",
          "normals.frag.glsl");
  }

  // Tell Regl exactly how to bind the attributes your normals.vert expects:
  attributes(regl) {
    return {
      // GLSL: attribute vec3 vertex_position;
      vertex_position: regl.prop("mesh.vertex_position"),  

      // GLSL: attribute vec3 vertex_normal;
      vertex_normal:   regl.prop("mesh.vertex_normal"),
    };
  }

  uniforms(regl) {
    return {
      mat_mvp:             regl.prop("mat_mvp"),
      mat_normals_to_view: regl.prop("mat_normals_to_view"),
    };
  }

  render(scene_state) {
    const entries = [];
    console.log("OBJECTS: "+scene_state.scene.objects)
    for (const obj of scene_state.scene.objects) {
      
      const mesh = this.resource_manager.get_mesh(obj.mesh_reference);
      mesh_preprocess(this.regl,mesh)
      console.log("NORMALS "+obj.mesh_reference +": " +mesh.vertex_normal)
      const { mat_model_view_projection: mvp,
              mat_normals_model_view: normalMat } =
        scene_state.scene.camera.object_matrices.get(obj);
      entries.push({
        mesh,
        mat_mvp:            mvp,
        mat_normals_to_view: normalMat,
      });
    }
    if (entries.length) this.pipeline(entries);
  }
}
