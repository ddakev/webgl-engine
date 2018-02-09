function GameObject(programInfo, mesh) {
    this.mesh = typeof mesh !== 'undefined' ? mesh : null;
    this.programInfo = typeof programInfo !== 'undefined' ? programInfo : null;
    this.position = new vec3(0, 0, 0);
    this.direction = new vec3(0, 1, 0);
    this.scale = new vec3(1, 1, 1);
    this.parent = null;
    this.children = [];
    
    if(typeof mesh !== 'undefined') {
        let e = {
            xmin: null,
            xmax: null,
            ymin: null,
            ymax: null,
            zmin: null,
            zmax: null
        };
        for(let i=0; i<this.mesh.vertices.length; i+=3) {
            if(this.mesh.vertices[i] < e.xmin || e.xmin == null) {
                e.xmin = this.mesh.vertices[i];
            }
            if(this.mesh.vertices[i] > e.xmax || e.xmax == null) {
                e.xmax = this.mesh.vertices[i];
            }
            if(this.mesh.vertices[i+1] < e.ymin || e.ymin == null) {
                e.ymin = this.mesh.vertices[i+1];
            }
            if(this.mesh.vertices[i+1] > e.ymax || e.ymax == null) {
                e.ymax = this.mesh.vertices[i+1];
            }
            if(this.mesh.vertices[i+2] < e.zmin || e.zmin == null) {
                e.zmin = this.mesh.vertices[i+2];
            }
            if(this.mesh.vertices[i+2] > e.zmax || e.zmax == null) {
                e.zmax = this.mesh.vertices[i+2];
            }
        }
        this.boundingBox = [
            new vec3(e.xmin, e.ymin, e.zmin),
            new vec3(e.xmin, e.ymin, e.zmax),
            new vec3(e.xmin, e.ymax, e.zmin),
            new vec3(e.xmin, e.ymax, e.zmax),
            new vec3(e.xmax, e.ymin, e.zmin),
            new vec3(e.xmax, e.ymin, e.zmax),
            new vec3(e.xmax, e.ymax, e.zmin),
            new vec3(e.xmax, e.ymax, e.zmax)
        ];
    }
}

GameObject.prototype.setParent = function(par) {
    if(this.parent) {
        this.parent.children.splice(this.parent.children.indexOf(this),1);
    }
    this.parent = par;
    par.children.push(this);
};

GameObject.prototype.getParent = function() {
    return this.parent;
};

GameObject.prototype.addChild = function(ch) {
    this.children.push(ch);
    ch.setParent(this);
};

GameObject.prototype.getChildren = function() {
    return this.children;
};

GameObject.prototype.getModelMatrix = function() {
    return new mat4()
                .scale(this.getScale().x, this.getScale().z, this.getScale().y)
                .multiply(mat4.lookAt(new vec3(), new vec3(this.getDirection().x, this.getDirection().z, -this.getDirection().y), new vec3(0, 1, 0)))
                .translate(this.getPosition().x, this.getPosition().z, -this.getPosition().y);
};

GameObject.prototype.getWorldMatrix = function() {
    return GameObject.calculateWorldMatrix(this);
};

GameObject.calculateWorldMatrix = function(gobj) {
    let parentMatrix = new mat4();
    if(gobj.getParent()) {
        parentMatrix = GameObject.calculateWorldMatrix(gobj.getParent());
    }
    return gobj.getModelMatrix().multiply(parentMatrix);
};

GameObject.prototype.setDirection = function(direction) {
    this.direction = new vec3(direction);
};

GameObject.prototype.getDirection = function() {
    return this.direction;
};

GameObject.prototype.setPosition = function(position) {
    this.position = new vec3(position);
};

GameObject.prototype.getPosition = function() {
    return this.position;
};

GameObject.prototype.getAbsolutePosition = function() {
    let gCoords = this.getWorldMatrix().multiply(new vec4(0, 0, 0, 1));
    return new vec3(gCoords.x, -gCoords.z, gCoords.y);
};

GameObject.prototype.setScale = function(scale) {
    this.scale = new vec3(scale);
};

GameObject.prototype.getScale = function() {
    return this.scale;
};

GameObject.prototype.move = function(direction, distance) {
    let [xdist, ydist, zdist] = direction.xyz;
    if(distance) {
        xdist = (direction.x / direction.norm()) * distance;
        ydist = (direction.y / direction.norm()) * distance;
        zdist = (direction.z / direction.norm()) * distance;
    }
    this.position = this.position.add(new vec3(xdist, ydist, zdist));
    return this;
};

GameObject.prototype.moveForward = function(distance) {
    this.move(this.getDirection(), distance);
};

GameObject.prototype.moveBackward = function(distance) {
    this.move(this.getDirection().scale(-1), distance);
};

GameObject.prototype.moveLeft = function(distance) {
    this.move(vec3.UP.cross(this.getDirection()), distance);
};

GameObject.prototype.moveRight = function(distance) {
    this.move(vec3.UP.cross(this.getDirection()).scale(-1), distance);
};

GameObject.prototype.moveUp = function(distance) {
    this.move(vec3.UP, distance);
};

GameObject.prototype.moveDown = function(distance) {
    this.move(vec3.UP.scale(-1), distance);
};

GameObject.prototype.applyScale = function(sFactor) {
    this.setScale(new vec3(this.getScale().x*sFactor.x, this.getScale().y*sFactor.y, this.getScale().z*sFactor.z));
    return this;
};

GameObject.prototype.rotate = function(axis, angle) {
    this.setDirection(new mat4().rotate(axis, angle).multiply(new vec4(this.getDirection(), 0)).normalize().xyz);
    return this;
};

GameObject.prototype.pitch = function(angle) {
    this.rotate(this.getDirection().cross(vec3.UP), angle);
    return this;
};

GameObject.prototype.yaw = function(angle) {
    this.rotate(this.getDirection().cross(this.getDirection().cross(vec3.UP)), angle);
    return this;
};

GameObject.prototype.roll = function(angle) {
    this.rotate(this.getDirection(), angle);
    return this;
};

GameObject.prototype.lookAt = function(target) {
    if(target instanceof GameObject) {
        this.direction = target.getAbsolutePosition().subtract(this.getAbsolutePosition()).normalize();
    }
    else {
        this.direction = target.normalize();
    }
};

GameObject.prototype.draw = function(gl, camera) {
    if(!this.shouldDraw(camera)) return;
    gl.useProgram(this.programInfo.program);
    setAttributes(this.programInfo.attribSetters, this.mesh.attribs);
    
    if(this.mesh.material) {
        this.mesh.material.setUniforms(this.programInfo);
    }
    
    let modelMatrix = this.getWorldMatrix();
    let modelViewProjectionMatrix = modelMatrix.multiply(camera.getViewProjectionMatrix());
    let modelInverseTransposeMatrix = modelMatrix.inverseTranspose();
    let matrices = {
        u_modelViewProjection:      modelViewProjectionMatrix.mat,
        u_model:                    modelMatrix.mat,
        u_modelInverseTranspose:    modelInverseTransposeMatrix.mat,
        u_viewWorldPosition:        [camera.getAbsolutePosition().x, camera.getAbsolutePosition().z, -camera.getAbsolutePosition().y],
    };
    setUniforms(this.programInfo.uniformSetters, matrices);
    
    setUniforms(this.programInfo.uniformSetters, { u_clipPlane: [clipPlane.x, clipPlane.z, -clipPlane.y, clipPlane.w] });
    let lightSizes = {
        u_numPoint: pointLights.length,
        u_numSpot:  spotLights.length
    };
    setUniforms(this.programInfo.uniformSetters, lightSizes);
    dirLight.setUniforms(this.programInfo, modelMatrix);
    for(let i=0; i<pointLights.length; i++) {
        pointLights[i].setUniforms(this.programInfo, i);
    }
    for(let i=0; i<spotLights.length; i++) {
        spotLights[i].setUniforms(this.programInfo, i);
    }
    
    setUniforms(this.programInfo.uniformSetters, {
        u_offsets: jitters,
        u_strataSize: 1/512
    });
    
    if(!this.mesh.indices || this.mesh.indices.length == 0) {
        gl.drawArrays(gl.TRIANGLES, 0, this.mesh.vertices.length/3);
    }
    else {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.mesh.indices.length, gl.UNSIGNED_SHORT, 0);
    }
};

GameObject.prototype.drawShadow = function(gl, programInfo, camera) {
    if(!this.shouldDraw(camera)) return;
    gl.useProgram(programInfo.program);
    setAttributes(programInfo.attribSetters, this.mesh.attribs);
    
    let modelMatrix = this.getWorldMatrix();
    let modelViewProjectionMatrix = modelMatrix.multiply(camera.getViewProjectionMatrix());
    setUniforms(programInfo.uniformSetters, {
        u_modelViewProjection:      modelViewProjectionMatrix.mat
    });
    
    if(!this.mesh.indices || this.mesh.indices.length == 0) {
        gl.drawArrays(gl.TRIANGLES, 0, this.mesh.vertices.length/3);
    }
    else {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.mesh.indices.length, gl.UNSIGNED_SHORT, 0);
    }
};

GameObject.prototype.shouldDraw = function(camera) {
    let outsidePlane = {
        left: 0, right: 0, near: 0, far: 0, top: 0, bottom: 0
    };
    let modelMatrix = this.getWorldMatrix();
    for(let i=0; i<this.boundingBox.length; i++) {
        let bbVert = modelMatrix.multiply(new vec4(this.boundingBox[i], 1.0));
        bbVert = new vec3(bbVert.xyz);
        let vertInside = 0;
        if(bbVert.dot(new vec3(camera.planes.left.xyz)) + camera.planes.left.w < 0) {
            outsidePlane.left ++;
            vertInside++;
        }
        if(bbVert.dot(new vec3(camera.planes.right.xyz)) + camera.planes.right.w < 0) {
            outsidePlane.right ++;
            vertInside++;
        }
        if(bbVert.dot(new vec3(camera.planes.near.xyz)) + camera.planes.near.w < 0) {
            outsidePlane.near ++;
            vertInside++;
        }
        if(bbVert.dot(new vec3(camera.planes.far.xyz)) + camera.planes.far.w < 0) {
            outsidePlane.far ++;
            vertInside++;
        }
        if(bbVert.dot(new vec3(camera.planes.top.xyz)) + camera.planes.top.w < 0) {
            outsidePlane.top ++;
            vertInside++;
        }
        if(bbVert.dot(new vec3(camera.planes.bottom.xyz)) + camera.planes.bottom.w < 0) {
            outsidePlane.bottom ++;
            vertInside++;
        }
        if(vertInside == 6) return true;
    }
    for(let side in outsidePlane) {
        if(outsidePlane.hasOwnProperty(side) && outsidePlane[side] == this.boundingBox.length)
            return false;
    }
    return true;                                                                                                                            // TEST THIS
};
