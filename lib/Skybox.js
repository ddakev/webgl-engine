function Skybox(gl, programInfo, cubemap) {
    this.indices = [
         0,  2,  1,      2,  3,  1,     // front
         4,  6,  5,      4,  7,  6,     // right
         8,  10, 9,      8, 11, 10,     // top
        12, 14, 13,     13, 14, 15,     // left
        16, 18, 17,     16, 19, 18,     // bottom
        20, 22, 21,     22, 23, 21      // back
    ];
    this.vertices = [
        //front
        -10, -10, 10,
        10, -10, 10,
        -10, 10, 10,
        10, 10, 10,
        
        //right
        10, -10, 10,
        10, -10, -10,
        10, 10, -10,
        10, 10, 10,
        
        //top
        10, 10, 10,
        10, 10, -10,
        -10, 10, -10,
        -10, 10, 10,
        
        //left
        -10, 10, 10,
        -10, 10, -10,
        -10, -10, 10,
        -10, -10, -10,
        
        //bottom
        -10, -10, 10,
        -10, -10, -10,
        10, -10, -10,
        10, -10, 10,
        
        //back
        10, -10, -10,
        -10, -10, -10,
        10, 10, -10,
        -10, 10, -10
    ];
    this.programInfo = programInfo;
    this.textures = Skybox.unpackTextures(cubemap);
    this.texture = null;
    
    this.attribs = {};
    if(typeof gl !== 'undefined') {
        this.setAttribs(gl);
    }
}

Skybox.prototype.setAttribs = function(gl) {
    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    
    let indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
    
    this.attribs = {
        a_position: {buffer: positionBuffer, numComponents: 3}
    };
    this.indexBuffer = indexBuffer;
    
    this.texture = gl.createTexture();
    
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.textures.px);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.textures.py);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.textures.pz);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.textures.nx);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.textures.ny);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.textures.nz);
    
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    //gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
};

Skybox.prototype.draw = function(gl, camera) {
    gl.useProgram(this.programInfo.program);
    setAttributes(this.programInfo.attribSetters, this.attribs);
    
    let viewProjectionMatrix = camera.getMatrixWoTranslation();
    setUniforms(this.programInfo.uniformSetters, {
        u_viewProjection:   viewProjectionMatrix.mat,
        cube_texture:       this.texture
    });
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
};

Skybox.unpackTextures = function(cubemap) {
    let textures = {};
    let tWidth = cubemap.width / 4;
    let tHeight = cubemap.height / 3;
    let x = 0, y = 0;
    let imdata = [];
    
    x = 1;
    y = 2;
    for(let i = tHeight * x; i< tHeight * (x+1); i++) {
        imdata.push(...cubemap.data.slice((i * cubemap.width + tWidth * y) * 4, (i * cubemap.width + tWidth * (y+1)) * 4));
    }
    textures.px = new ImageData(new Uint8ClampedArray(imdata), tWidth, tHeight);
    
    imdata = [];
    x = 0;
    y = 1;
    for(let i = tHeight * x; i< tHeight * (x+1); i++) {
        imdata.push(...cubemap.data.slice((i * cubemap.width + tWidth * y) * 4, (i * cubemap.width + tWidth * (y+1)) * 4));
    }
    textures.py = new ImageData(new Uint8ClampedArray(imdata), tWidth, tHeight);
    
    imdata = [];
    x = 1;
    y = 1;
    for(let i = tHeight * x; i< tHeight * (x+1); i++) {
        imdata.push(...cubemap.data.slice((i * cubemap.width + tWidth * y) * 4, (i * cubemap.width + tWidth * (y+1)) * 4));
    }
    textures.pz = new ImageData(new Uint8ClampedArray(imdata), tWidth, tHeight);
    
    imdata = [];
    x = 1;
    y = 0;
    for(let i = tHeight * x; i< tHeight * (x+1); i++) {
        imdata.push(...cubemap.data.slice((i * cubemap.width + tWidth * y) * 4, (i * cubemap.width + tWidth * (y+1)) * 4));
    }
    textures.nx = new ImageData(new Uint8ClampedArray(imdata), tWidth, tHeight);
    
    imdata = [];
    x = 2;
    y = 1;
    for(let i = tHeight * x; i< tHeight * (x+1); i++) {
        imdata.push(...cubemap.data.slice((i * cubemap.width + tWidth * y) * 4, (i * cubemap.width + tWidth * (y+1)) * 4));
    }
    textures.ny = new ImageData(new Uint8ClampedArray(imdata), tWidth, tHeight);
    
    imdata = [];
    x = 1;
    y = 3;
    for(let i = tHeight * x; i< tHeight * (x+1); i++) {
        imdata.push(...cubemap.data.slice((i * cubemap.width + tWidth * y) * 4, (i * cubemap.width + tWidth * (y+1)) * 4));
    }
    textures.nz = new ImageData(new Uint8ClampedArray(imdata), tWidth, tHeight);
    
    return textures;
};