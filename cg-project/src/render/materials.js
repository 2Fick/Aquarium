
const default_texture = null;
const default_base_color = [1.0, 0.0, 1.0];  // magenta, used when no texture is provided
const default_shininess = 0.1;


/*---------------------------------------------------------------
    Materials
---------------------------------------------------------------*/
/**
 * Materials are defined by parameters that describe how 
 * different objects interact with light.
 * 
 * The `properties` array can be used to indicate by 
 * which shaders will process this material. 
 * ShaderRenderer classes have an `exclude()` function whose
 * behavior can be customized to adapt to different material properties.
 */

class Material {

    constructor() {
        this.texture = default_texture;
        this.color = default_base_color;
        this.shininess = default_shininess;
        this.opacity = 1.0;
        this.properties = [];
    }

}

class BackgroundMaterial extends Material {

    constructor({ texture = default_texture }) {
        super()
        this.texture = texture;
        this.properties.push("environment");
        this.properties.push("no_blinn_phong");
    }
}

class DiffuseMaterial extends Material {

    constructor({
        texture = null,
        color = default_base_color,
        shininess = default_shininess,
        opacity = 1.0
    }) {
        super()
        this.texture = texture;
        this.color = color;
        this.shininess = shininess;
        this.opacity = opacity;
    }
}

class ReflectiveMaterial extends Material {
    constructor(
        { texture = default_texture }
    ) {
        super()
        this.texture = texture;
        this.properties.push("reflective");
        this.texture = texture

    }
}

class WaterMaterial extends Material {
    constructor() {
        super()
        this.properties.push("water");
    }
}

class TerrainMaterial extends Material {
    constructor({
        water_color = [0.03, 0.71, 1.12],
        water_shininess = 100.,
        sand_color = [0.33, 0.43, 0.18],
        sand_shininess = 100.,
        deep_water_color = [0.29, 0.51, 0.62],
        deep_water_shininess = 100.,
    }) {
        super()
        this.water_color = water_color;
        this.water_shininess = water_shininess;
        this.sand_color = sand_color
        this.sand_shininess = sand_shininess;
        this.deep_water_color = deep_water_color;
        this.deep_water_shininess = deep_water_shininess

        this.properties.push("terrain");
        this.properties.push("no_blinn_phong");
    }
}

/*---------------------------------------------------------------
    Material Instantiation
---------------------------------------------------------------*/
/**
 * Here materials are defined to later be assigned to objects.
 * Choose the material class, and specify its customizable parameters.
 */
export const sunset_sky = new BackgroundMaterial({
    texture: 'kloppenheim_07_puresky_blur.jpg'
});

export const street = new BackgroundMaterial({
    texture: 'regent_street.jpg'
});

export const underwater = new BackgroundMaterial({
    texture: 'underwater.jpg'
});

export const fish = new DiffuseMaterial({
    texture: 'fish_texture.png',
    shininess: 0.5
});

export const angler = new DiffuseMaterial({
    texture: 'angler.png',
    shininess: 1.
});

export const nemo = new DiffuseMaterial({
    texture: 'nemo_text.png',
    shininess: 0.5
});

export const shark_cartoon = new DiffuseMaterial({
    texture: 'shark_cartoon.jpg',
    shininess: 0.5
});

export const mirror = new ReflectiveMaterial({
    texture: 'marble.png'
});

export const gray = new DiffuseMaterial({
    color: [0.4, 0.4, 0.4],
    shininess: 0.5
});

export const gold = new DiffuseMaterial({
    texture: 'tex_gold',
    shininess: 14.0
});

export const pine = new DiffuseMaterial({
    texture: 'pine.png',
    shininess: 0.5
});

export const blue = new DiffuseMaterial({
    color: [0., 0., 0.8],
    shininess: 0.,
    opacity: .4
});

export const water = new WaterMaterial({});

// Terrain material used for the sand scene.
export const terrain = new TerrainMaterial({
    water_color: [0.03, 0.71, 1.12],
    sand_color: [0.76, 0.69, 0.5],
    
    deep_water_color: [0.26, 0.83, 0.93]
});


export const mirror_material = new ReflectiveMaterial({
    texture: 'marble.png',
    color: [0.4, 0.4, 0.4],
    shininess: 0.5,

});