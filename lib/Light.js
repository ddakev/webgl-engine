function DirectionalLight(direction, props = {}) {
    GameObject.call(this);
    this.direction = direction;
    if(this.direction instanceof Array) {
        this.direction = new vec3(this.direction);
    }
    this.color = props.color || [255, 255, 255];
    this.color = new vec3(this.color).normalize().xyz;
    this.intensity = props.intensity || 1;
    this.ambientIntensity = props.ambientIntensity || 0.2;
    this.specularIntensity = props.specularIntensity || 0.2;
    this.shadowMapCascades = [];
    this.viewProjectionCascades = [];
    this.camera = null;
}
DirectionalLight.prototype = Object.create(GameObject.prototype);
DirectionalLight.prototype.constructor = DirectionalLight;

DirectionalLight.prototype.setUniforms = function(programInfo, modelMat) {
    let prefix = "dirLight.";
    let uniforms = {};
    uniforms[prefix + "direction"] = [this.direction.x, this.direction.z, -this.direction.y];
    uniforms[prefix + "color"] = this.color;
    uniforms[prefix + "intensity"] = this.intensity;
    uniforms[prefix + "ambientIntensity"] = this.ambientIntensity;
    uniforms[prefix + "specularIntensity"] = this.specularIntensity;
    if(modelMat) {
        uniforms[prefix + "numCascades"] = this.shadowMapCascades.length;
        uniforms[prefix + "shadowMapCascades"] = this.shadowMapCascades;
        let bmvProj = [];
        for(let i=0; i<this.viewProjectionCascades.length; i++) {
            bmvProj.push(modelMat.multiply(this.viewProjectionCascades[i]).multiply(new mat4([0.5, 0.0, 0.0, 0.0,
                                                                                            0.0, 0.5, 0.0, 0.0,
                                                                                            0.0, 0.0, 0.5, 0.0,
                                                                                            0.5, 0.5, 0.5, 1.0])).mat);
        }
        let bmvConcat = [];
        for(let i=0; i<this.viewProjectionCascades.length; i++) {
            bmvConcat = bmvConcat.concat(bmvProj[i]);
        }
        uniforms[prefix + "bModelViewProjections"] = bmvConcat;
    }
    setUniforms(programInfo.uniformSetters, uniforms);
};

DirectionalLight.prototype.setDirection = function(direction) {
    GameObject.prototype.setDirection.call(this, direction);
    this.camera.setDirection(direction);
};

DirectionalLight.prototype.setCamera = function(camera) {
    this.camera = camera;
};



function PointLight(position, props = {}) {
    GameObject.call(this);
    this.position = position;
    if(this.position instanceof Array) {
        this.position = new vec3(this.position);
    }
    this.color = props.color || [255, 255, 255];
    this.color = new vec3(this.color).normalize().xyz;
    this.intensity = props.intensity || 1;
    this.ambientIntensity = props.ambientIntensity || 0.2;
    this.specularIntensity = props.specularIntensity || 0.2;
    if(props.range) {
        this.range = props.range;
        this.constant = 1;
        this.linear = 5 / this.range;
        this.quadratic = 90 / (this.range * this.range);
    }
    else {
        this.constant = props.constant || 1;
        this.linear = props.linear || 0;
        this.quadratic = props.quadratic || 0;
    }
}
PointLight.prototype = Object.create(GameObject.prototype);
PointLight.prototype.constructor = PointLight;

PointLight.prototype.setUniforms = function(programInfo, ind) {
    let prefix = "pointLights[" + ind + "].";
    let uniforms = {};
    uniforms[prefix + "position"] = [this.position.x, this.position.z, -this.position.y];
    uniforms[prefix + "color"] = this.color;
    uniforms[prefix + "intensity"] = this.intensity;
    uniforms[prefix + "ambientIntensity"] = this.ambientIntensity;
    uniforms[prefix + "specularIntensity"] = this.specularIntensity;
    uniforms[prefix + "constant"] = this.constant;
    uniforms[prefix + "linear"] = this.linear;
    uniforms[prefix + "quadratic"] = this.quadratic;
    setUniforms(programInfo.uniformSetters, uniforms);
};



function SpotLight(position, direction, props = {}) {
    GameObject.call(this);
    this.position = position;
    if(this.position instanceof Array) {
        this.position = new vec3(this.position);
    }
    this.direction = direction;
    if(this.direction instanceof Array) {
        this.direction = new vec3(this.direction);
    }
    this.color = props.color || [255, 255, 255];
    this.color = new vec3(this.color).normalize().xyz;
    this.intensity = props.intensity || 1;
    this.ambientIntensity = props.ambientIntensity || 0.2;
    this.specularIntensity = props.specularIntensity || 0.2;
    this.innerCutoff = Math.cos(props.innerCutoff * Math.PI/180) || Math.cos(15 * Math.PI/180);
    this.outerCutoff = Math.cos(props.outerCutoff * Math.PI/180) || Math.cos(props.cutoff * Math.PI/180) || Math.cos(20 * Math.PI/180);
    if(props.range) {
        this.range = props.range;
        this.constant = 1;
        this.linear = 5 / this.range;
        this.quadratic = 90 / (this.range * this.range);
    }
    else {
        this.constant = props.constant || 1;
        this.linear = props.linear || 0;
        this.quadratic = props.quadratic || 0;
    }
}
SpotLight.prototype = Object.create(GameObject.prototype);
SpotLight.prototype.constructor = SpotLight;

SpotLight.prototype.setUniforms = function(programInfo, ind) {
    let prefix = "spotLights[" + ind + "].";
    let uniforms = {};
    uniforms[prefix + "position"] = [this.position.x, this.position.z, -this.position.y];
    uniforms[prefix + "direction"] = [this.direction.x, this.direction.z, -this.direction.y];
    uniforms[prefix + "color"] = this.color;
    uniforms[prefix + "intensity"] = this.intensity;
    uniforms[prefix + "ambientIntensity"] = this.ambientIntensity;
    uniforms[prefix + "specularIntensity"] = this.specularIntensity;
    uniforms[prefix + "innerCutoff"] = this.innerCutoff;
    uniforms[prefix + "outerCutoff"] = this.outerCutoff;
    uniforms[prefix + "constant"] = this.constant;
    uniforms[prefix + "linear"] = this.linear;
    uniforms[prefix + "quadratic"] = this.quadratic;
    setUniforms(programInfo.uniformSetters, uniforms);
};