function Water(gl, programInfo, width, height, maps) {
    GameObject.call(this, programInfo);
    
    this.mesh = {
        vertices: [
            0,      0, 0,
            width,  0, 0,
            width,  0, -height,
            0,      0, -height
        ],
        indices: [
            0, 1, 2,
            0, 2, 3
        ]
    };
    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mesh.vertices), gl.STATIC_DRAW);
    
    let indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.mesh.indices), gl.STATIC_DRAW);
    
    this.mesh.attribs = {
        a_position: {buffer: positionBuffer, numComponents: 3}
    };
    this.mesh.indexBuffer = indexBuffer;
    
    this.waveSpeed = 0.01;
    this.waveOffset = 0;
    
    this.dudvTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.dudvTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, maps.dudv);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    
    this.normalTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.normalTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, maps.normal);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
}
Water.prototype = Object.create(GameObject.prototype);
Water.prototype.constructor = Water;

Water.prototype.draw = function(gl, camera, reflection, refraction, refractionDepth) {
    gl.useProgram(this.programInfo.program);
    setAttributes(this.programInfo.attribSetters, this.mesh.attribs);
    setUniforms(this.programInfo.uniformSetters, {
        u_color:    [0, 0, 255],
        u_reflectionTexture: reflection,
        u_refractionTexture: refraction,
        u_refractionDepth:   refractionDepth,
        u_dudvMap:      this.dudvTexture,
        u_normalMap:    this.normalTexture,
        u_texFactor:    1/256,
        u_moveFactor:   this.waveOffset,
        u_shininess:    20,
        u_reflectivity: 0.6,
        u_near:         camera.near,
        u_far:          camera.far,
        u_cameraPosition: [camera.getPosition().x, camera.getPosition().z, -camera.getPosition().y]
    });
    dirLight.setUniforms(this.programInfo);
    
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
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.mesh.indices.length, gl.UNSIGNED_SHORT, 0);
};

Water.prototype.moveWaves = function(dt) {
    if(isNaN(dt)) return;
    this.waveOffset += this.waveSpeed * dt;
    this.waveOffset %= 1;
};