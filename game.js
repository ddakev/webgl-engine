function GameObject(programInfo, mesh) {
    this.mesh = typeof mesh !== 'undefined' ? mesh : null;
    this.programInfo = typeof programInfo !== 'undefined' ? programInfo : null;
    this.position = new vec3();
    this.direction = new vec3();
    this.modelMatrix = new mat4();
    this.worldMatrix = new mat4();
    this.parent = null;
    this.children = [];
}

GameObject.prototype.setParent = function(par) {
    if(this.parent) {
        this.parent.children.splice(this.parent.children.indexOf(this),1);
    }
    this.parent = par;
    par.children.push(this);
    GameObject.updateMatrices(this);
};

GameObject.prototype.addChild = function(ch) {
    this.children.push(ch);
    ch.parent = this;
    GameObject.updateMatrices(ch);
};

GameObject.prototype.getWorldMatrix = function() {
    return this.worldMatrix;
};

GameObject.prototype.applyTransformations = function(transforms) {
    this.modelMatrix = this.modelMatrix.multiply(transforms);
    GameObject.updateMatrices(this);
};

GameObject.prototype.draw = function(gl, camera) {
    gl.useProgram(this.programInfo.program);
    setAttributes(this.programInfo.attribSetters, this.mesh.attribs);
    
    if(this.mesh.material) {
        this.mesh.material.setUniforms(this.programInfo);
    }
    
    var lightSizes = {
        u_numDir:   dirLights.length,
        u_numPoint: pointLights.length,
        u_numSpot:  spotLights.length
    };
    setUniforms(this.programInfo.uniformSetters, lightSizes);
    for(var i=0; i<dirLights.length; i++) {
        dirLights[i].setUniforms(this.programInfo, i);
    }
    for(var i=0; i<pointLights.length; i++) {
        pointLights[i].setUniforms(this.programInfo, i);
    }
    for(var i=0; i<spotLights.length; i++) {
        spotLights[i].setUniforms(this.programInfo, i);
    }
    
    var modelMatrix = this.getWorldMatrix();
    var modelViewProjectionMatrix = modelMatrix.multiply(camera.getViewProjectionMatrix());
    var modelInverseTransposeMatrix = modelMatrix.inverseTranspose();
    var matrices = {
        u_modelViewProjection:      modelViewProjectionMatrix.mat,
        u_model:                    modelMatrix.mat,
        u_modelInverseTranspose:    modelInverseTransposeMatrix.mat,
        u_viewWorldPosition:        camera.position.xyz,
    };
    setUniforms(this.programInfo.uniformSetters, matrices);
    
    if(!this.mesh.indices || this.mesh.indices.length == 0) {
        gl.drawArrays(gl.TRIANGLES, 0, this.mesh.vertices.length/3);
    }
    else {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.mesh.indices.length, gl.UNSIGNED_SHORT, 0);
    }
};

GameObject.updateMatrices = function(node) {
    if(node.parent !== null) {
        node.worldMatrix = node.modelMatrix.multiply(node.parent.worldMatrix);
    }
    else {
        node.worldMatrix = node.modelMatrix;
    }
    
    if(node instanceof DirectionalLight) {
        node.direction = node.worldMatrix.multiply(new vec4(node.initialDirection, 0)).xyz;
    }
    else if(node instanceof PointLight) {
        node.position = node.worldMatrix.multiply(new vec4(node.initialPosition, 1)).xyz;
    }
    else if(node instanceof SpotLight) {
        node.position = node.worldMatrix.multiply(new vec4(node.initialPosition, 1)).xyz;
        node.direction = node.worldMatrix.multiply(new vec4(node.initialDirection, 0)).xyz;
    }
    else if(node instanceof Camera) {
        node.position = node.modelMatrix.multiply(new vec4(node.initialPosition, 1)).xyz;
        node.viewProjection = node.worldMatrix.inverse().multiply(node.projection);
    }
    else {
        node.position = node.worldMatrix.multiply(new vec4(0, 0, 0, 1)).xyz;
        node.direction = node.worldMatrix.multiply(new vec4(1, 0, 0, 0)).normalize().xyz;
    }
    
    for(var i=0; i<node.children.length; i++) {
        GameObject.updateMatrices(node.children[i]);
    }
};



function Sphere(gl, detail, material, radius) {
    this.vertices = [];
    this.normals = [];
    this.uvs = [];
    this.indices = [];
    this.material = material || new Material(gl);
    var det = typeof detail === 'undefined' ? 32 : detail;
    var step = 360/det;
    var rad = typeof radius === 'undefined' ? 0.5 : radius;
    
    for(var phi = 0; phi <= 180; phi += step) {
        for(var th = 0; th <= 360; th += step) {
            var vx = rad * Math.sin(phi*Math.PI/180) * Math.cos(th*Math.PI/180);
            var vy = rad * Math.cos(phi*Math.PI/180);
            var vz = rad * Math.sin(phi*Math.PI/180) * Math.sin(th*Math.PI/180);
            
            var n = new vec3([vx, vy, vz]).normalize().xyz;
            
            var u = -th / 360;
            var v = phi / 180;
            
            this.vertices = this.vertices.concat([vx, vy, vz]);
            this.normals = this.normals.concat(n);
            this.uvs = this.uvs.concat([u, v]);
        }
    }
    
    var offset = det+1;
    for(var i=1; i<=180/step; i++) {
        for(var j=0; j<360/step; j++) {
            var i11 = Math.max(offset + j - det-1, 0);
            var i12 = Math.max(offset+j+1 - det-1, 0);
            var i21 = Math.min(offset + j, this.vertices.length/3-1);
            var i22 = Math.min(offset + j + 1, this.vertices.length/3-1);
            
            this.indices = this.indices.concat([i21, i11, i12, i21, i12, i22]);
        }
        offset += det+1;
    }
    
    this.attribs = {};
    if(typeof gl !== 'undefined') {
        this.setAttribs(gl);
    }
}

Sphere.prototype.setAttribs = function(gl) {
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    
    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
    
    var uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvs), gl.STATIC_DRAW);
    
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
    
    this.attribs = {
        a_position: {buffer: positionBuffer, numComponents: 3},
        a_normal: {buffer: normalBuffer, numComponents: 3},
        a_uv: {buffer: uvBuffer, numComponents: 2}
    };
    this.indexBuffer = indexBuffer;
};



function Cube(gl, size, material) {
    var rad = typeof size === 'undefined' ? 0.5 : size/2;
    this.indices = [
         0,  1,  2,      2,  1,  3,     // front
         4,  5,  6,      4,  6,  7,     // right
         8,  9, 10,      8, 10, 11,     // top
        12, 13, 14,     13, 15, 14,     // left
        16, 17, 18,     16, 18, 19,     // bottom
        20, 21, 22,     22, 21, 23      // back
    ];
    this.vertices = [
        //front
        -rad, -rad, rad,
        rad, -rad, rad,
        -rad, rad, rad,
        rad, rad, rad,
        
        //right
        rad, -rad, rad,
        rad, -rad, -rad,
        rad, rad, -rad,
        rad, rad, rad,
        
        //top
        rad, rad, rad,
        rad, rad, -rad,
        -rad, rad, -rad,
        -rad, rad, rad,
        
        //left
        -rad, rad, rad,
        -rad, rad, -rad,
        -rad, -rad, rad,
        -rad, -rad, -rad,
        
        //bottom
        -rad, -rad, rad,
        -rad, -rad, -rad,
        rad, -rad, -rad,
        rad, -rad, rad,
        
        //back
        rad, -rad, -rad,
        -rad, -rad, -rad,
        rad, rad, -rad,
        -rad, rad, -rad
    ];
    this.normals = [
        //front
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        
        //right
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        
        //top
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        
        //left
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        
        //bottom
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        
        //back
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1
    ];
    this.uvs = [
        0, 0,
        1/3, 0,
        0, 1/2,
        1/3, 1/2,
        
        1/3, 1/2,
        2/3, 1/2,
        2/3, 0,
        1/3, 0,
        
        1, 1/2,
        1, 0,
        2/3, 0,
        2/3, 1/2,
        
        1/3, 1/2,
        0, 1/2,
        1/3, 1,
        0, 1,
        
        1/3, 1/2,
        1/3, 1,
        2/3, 1,
        2/3, 1/2,
        
        2/3, 1,
        1, 1,
        2/3, 1/2,
        1, 1/2
    ];
    this.material = material || new Material(gl);
    
    this.attribs = {};
    if(typeof gl !== 'undefined') {
        this.setAttribs(gl);
    }
}

Cube.prototype.setAttribs = function(gl) {
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    
    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
    
    var uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvs), gl.STATIC_DRAW);
    
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
    
    this.attribs = {
        a_position: {buffer: positionBuffer, numComponents: 3},
        a_normal: {buffer: normalBuffer, numComponents: 3},
        a_uv: {buffer: uvBuffer, numComponents: 2}
    };
    this.indexBuffer = indexBuffer;
};



function Material(gl, props) {
    if(typeof props === "undefined") {
        props = {};
    }
    var diffuseImage = props.diffuse || new Uint8Array([97, 61, 235, 255]);
    if(diffuseImage instanceof Array) {
        diffuseImage = new Uint8Array(diffuseImage);
    }
    var specularImage = props.specular || new Uint8Array([255, 255, 255, 255]);
    if(specularImage instanceof Array) {
        specularImage = new Uint8Array(specularImage);
    }
    this.shininess = props.shininess || 128;
    
    this.diffuse = null;
    if(typeof gl !== 'undefined') {
        this.diffuse = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.diffuse);
        if(diffuseImage instanceof Uint8Array) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, diffuseImage);
        }
        else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, diffuseImage);
        }
        gl.generateMipmap(gl.TEXTURE_2D);
    }
    
    this.specular = null;
    if(typeof gl !== 'undefined') {
        this.specular = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.specular);
        if(specularImage instanceof Uint8Array) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, specularImage);
        }
        else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, specularImage);
        }
        gl.generateMipmap(gl.TEXTURE_2D);
    }
}

Material.prototype.setUniforms = function(programInfo) {
    var prefix = "material.";
    var uniforms = {};
    uniforms[prefix + "diffuse"] = this.diffuse;
    uniforms[prefix + "specular"] = this.specular;
    uniforms[prefix + "shininess"] = this.shininess;
    setUniforms(programInfo.uniformSetters, uniforms);
};



function Camera(projectionMatrix, position, target) {
    GameObject.call(this);
    this.position = position || new vec3(0, 0, 0);
    if(this.position instanceof Array) {
        this.position = new vec3(this.position);
    }
    this.initialPosition = this.position.xyz;
    this.target = target || new vec3(0, 0, -1);
    if(this.target instanceof Array) {
        this.target = new vec3(this.target);
    }
    this.direction = new vec3(0, 0, -1);
    this.projection = projectionMatrix;
    this.viewProjection = this.projection;
    if(target) {
        this.lookAt(this.target);
    }
    else {
        this.setDirection(this.direction);
    }
}
Camera.prototype = Object.create(GameObject.prototype);
Camera.prototype.constructor = Camera;

Camera.prototype.getViewProjectionMatrix = function() {
    return this.viewProjection;
};

Camera.prototype.lookAt = function(target) {
    this.target = target;
    if(this.target instanceof Array) {
        this.target = new vec3(this.target);
    }
    var pos = null;
    if(this.parent) {
        if(this.target instanceof GameObject) {
            pos = this.parent.worldMatrix.inverse().multiply(new vec4(this.target.position, 1)).xyz;
        }
        else {
            pos = this.parent.worldMatrix.inverse().multiply(new vec4(this.target, 1)).xyz;
        }
    }
    else {
        if(this.target instanceof GameObject) {
            pos = this.target.position;
        }
        else {
            pos = this.target;
        }
    }
    this.modelMatrix = mat4.lookAt(this.position, pos, vec3.UP);
    GameObject.updateMatrices(this);
};

Camera.prototype.setDirection = function(direction) {
    this.direction = direction;
    if(this.direction instanceof Array) {
        this.direction = new vec3(this.direction);
    }
    var pos = this.position;
    if(this.parent) {
        pos = pos.add(this.parent.worldMatrix.inverse().multiply(new vec4(this.direction, 0)).xyz);
    }
    else {
        pos = pos.add(this.direction);
    }
    this.modelMatrix = mat4.lookAt(this.position, pos, vec3.UP);
    GameObject.updateMatrices(this);
};



function PerspectiveCamera(args, position, target) {
    var fov = args.fov || args.fieldOfView || 60;
    var aspect = args.aspect || args.aspectRatio || args.aRatio || 640/480;
    var near = args.near || 1;
    var far = args.far || 2000;
    Camera.call(this, mat4.perspective(fov, aspect, near, far), position, target);
    
}
PerspectiveCamera.prototype = Object.create(Camera.prototype);
PerspectiveCamera.prototype.constructor = PerspectiveCamera;



function OrthographicCamera(args, position, target) {
    var left = args.left || 0;
    var top = args.top || 0;
    var right = args.right || args.width ? args.width+left : 640+left;
    var bottom = args.bottom || args.height ? args.height+top : 480+top;
    var near = args.near || -400;
    var far = args.far || 400;
    Camera.call(this, mat4.orthographic(left, right, bottom, top, near, far), position, target);
    
}
OrthographicCamera.prototype = Object.create(Camera.prototype);
OrthographicCamera.prototype.constructor = OrthographicCamera;



function DirectionalLight(direction, props) {
    GameObject.call(this);
    this.direction = direction;
    if(this.direction instanceof Array) {
        this.direction = new vec3(this.direction);
    }
    this.initialDirection = this.direction.xyz;
    this.color = props.color || [255, 255, 255];
    this.color = new vec3(this.color).normalize().xyz;
    this.intensity = props.intensity || 1;
    this.ambientIntensity = props.ambientIntensity || 0.2;
    this.specularIntensity = props.specularIntensity || 0.2;
}
DirectionalLight.prototype = Object.create(GameObject.prototype);
DirectionalLight.prototype.constructor = DirectionalLight;

DirectionalLight.prototype.setUniforms = function(programInfo, ind) {
    var prefix = "dirLights[" + ind + "].";
    var uniforms = {};
    uniforms[prefix + "direction"] = this.direction.xyz;
    uniforms[prefix + "color"] = this.color;
    uniforms[prefix + "intensity"] = this.intensity;
    uniforms[prefix + "ambientIntensity"] = this.ambientIntensity;
    uniforms[prefix + "specularIntensity"] = this.specularIntensity;
    setUniforms(programInfo.uniformSetters, uniforms);
};



function PointLight(position, props) {
    GameObject.call(this);
    this.position = position;
    if(this.position instanceof Array) {
        this.position = new vec3(this.position);
    }
    this.initialPosition = this.position.xyz;
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
    var prefix = "pointLights[" + ind + "].";
    var uniforms = {};
    uniforms[prefix + "position"] = this.position.xyz;
    uniforms[prefix + "color"] = this.color;
    uniforms[prefix + "intensity"] = this.intensity;
    uniforms[prefix + "ambientIntensity"] = this.ambientIntensity;
    uniforms[prefix + "specularIntensity"] = this.specularIntensity;
    uniforms[prefix + "constant"] = this.constant;
    uniforms[prefix + "linear"] = this.linear;
    uniforms[prefix + "quadratic"] = this.quadratic;
    setUniforms(programInfo.uniformSetters, uniforms);
};



function SpotLight(position, direction, props) {
    GameObject.call(this);
    this.position = position;
    if(this.position instanceof Array) {
        this.position = new vec3(this.position);
    }
    this.initialPosition = this.position.xyz;
    this.direction = direction;
    if(this.direction instanceof Array) {
        this.direction = new vec3(this.direction);
    }
    this.initialDirection = this.direction.xyz;
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
    var prefix = "spotLights[" + ind + "].";
    var uniforms = {};
    uniforms[prefix + "position"] = this.position.xyz;
    uniforms[prefix + "direction"] = this.direction.xyz;
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