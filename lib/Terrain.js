function Terrain(gl, programInfo, heightTexture, moistureTexture, colorTexture, biomes, args) {
    GameObject.call(this, programInfo);
    
    this.heightmap = heightTexture;
    this.heightTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.heightTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, heightTexture);
    gl.generateMipmap(gl.TEXTURE_2D);
    
    this.moistureTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.moistureTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, moistureTexture);
    gl.generateMipmap(gl.TEXTURE_2D);
    
    this.colorTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, colorTexture);
    gl.generateMipmap(gl.TEXTURE_2D);
    
    this.biomes = {};
    for(let text in biomes) {
        if(biomes.hasOwnProperty(text)) {
            this.biomes[text] = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.biomes[text]);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, biomes[text]);
            gl.generateMipmap(gl.TEXTURE_2D);
        }
    }
    
    this.mesh = Terrain.generateMesh(gl, heightTexture, args);
    if(args && args.position) this.position = args.position;
}
Terrain.prototype = Object.create(GameObject.prototype);
Terrain.prototype.constructor = Terrain;

Terrain.prototype.getHeight = function(x, y) {
    let cCoord = this.heightmap.width * (y - this.getPosition().y) / (this.mesh.cols * this.mesh.squareSize);
    let rCoord = this.heightmap.height * (x - this.getPosition().x) / (this.mesh.rows * this.mesh.squareSize);
    if(cCoord < 0 || cCoord > this.heightmap.width || rCoord < 0 || rCoord > this.heightmap.height) return -Infinity;
    
    let h00 = this.heightmap.data[(Math.floor(rCoord) * this.heightmap.width + Math.floor(cCoord)) * 4];
    let h01 = this.heightmap.data[(Math.floor(rCoord) * this.heightmap.width + Math.ceil(cCoord)) * 4];
    let h10 = this.heightmap.data[(Math.ceil(rCoord) * this.heightmap.width + Math.floor(cCoord)) * 4];
    let h11 = this.heightmap.data[(Math.ceil(rCoord) * this.heightmap.width + Math.ceil(cCoord)) * 4];
    let rowInterp1 = (h01 - h00) * (cCoord - Math.floor(cCoord)) + h00;
    let rowInterp2 = (h11 - h10) * (cCoord - Math.floor(cCoord)) + h10;
    let interp = (rowInterp2 - rowInterp1) * (rCoord - Math.floor(rCoord)) + rowInterp1;
    return this.mesh.maxHeight * interp / 256 + this.getPosition().z;
};

Terrain.prototype.draw = function(gl, camera) {
    gl.useProgram(this.programInfo.program);
    setAttributes(this.programInfo.attribSetters, this.mesh.attribs);
    
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
    
    // set all biomes diffuse and normal textures; modify shaders to use them
    setUniforms(this.programInfo.uniformSetters, {
        "u_terrain.height": this.heightTexture,
        //"u_terrain.moisture": this.moistureTexture,
        //"u_terrain.diffuse": this.colorTexture,
        "u_biomes.sandDiffuse": this.biomes.sandDiffuse,
        "u_biomes.sandNormal": this.biomes.sandNormal,
        "u_biomes.grassDiffuse": this.biomes.grassDiffuse,
        "u_biomes.grassNormal": this.biomes.grassNormal,
        "u_biomes.forestDiffuse": this.biomes.forestDiffuse,
        "u_biomes.forestNormal": this.biomes.forestNormal,
        "u_biomes.snowDiffuse": this.biomes.snowDiffuse,
        "u_biomes.snowNormal": this.biomes.snowNormal,
        u_bFactor: 64,
        u_waterLevel: water.getPosition().z,
        u_normalTexture: this.mesh.normalTexture,
        u_colsFactor: 1 / (this.mesh.cols * this.mesh.squareSize),
        u_rowsFactor: 1 / (this.mesh.rows * this.mesh.squareSize),
        u_clipPlane: [clipPlane.x, clipPlane.z, -clipPlane.y, clipPlane.w]
    });
    dirLight.setUniforms(this.programInfo, modelMatrix);
    
    setUniforms(this.programInfo.uniformSetters, {
        u_offsets: jitters,
        u_strataSize: 1/(1<<10)
    });
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.mesh.indices.length, gl.UNSIGNED_SHORT, 0);
};

Terrain.prototype.drawShadow = function(gl, programInfo, camera) {
    gl.useProgram(programInfo.program);
    setAttributes(programInfo.attribSetters, this.mesh.attribs);
    
    let modelMatrix = this.getWorldMatrix();
    let modelViewProjectionMatrix = modelMatrix.multiply(camera.getViewProjectionMatrix());
    setUniforms(programInfo.uniformSetters, {
        u_modelViewProjection:      modelViewProjectionMatrix.mat
    });
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.mesh.indices.length, gl.UNSIGNED_SHORT, 0);
};

Terrain.generateMesh = function(gl, heightmap, args) {
    let rows = heightmap.height;
    let cols = heightmap.width;
    let squareSize = args ? args.squareSize || 1 : 1;
    let maxHeight = args ? args.maxHeight || 10 : 10;
    let mesh = { indices: [], vertices: [], normals: [] };
    let index = 0;
    for(let i = 0; i < rows; i++) {
        for(let j = 0; j < cols; j++) {
            let thisHeight = (heightmap.data[(i * cols + j) * 4 + 0] / 256) * maxHeight;
            mesh.vertices.push(i * squareSize, thisHeight, -j * squareSize);
            
            let normal = new vec3();
            let nCount = 0;
            let v1, v2, v3;
            // upper left square
            if(i-1 >= 0 && i <= rows-1 && j-1 >= 0 && j <= cols-1) {
                v1 = new vec3(-1 * squareSize, (heightmap.data[((i-1) * cols + j-1) * 4 + 0] / 256) * maxHeight - thisHeight, 1 * squareSize);
                v2 = new vec3(-1 * squareSize, (heightmap.data[((i-1) * cols + j) * 4 + 0] / 256) * maxHeight - thisHeight, 0 * squareSize);
                v3 = new vec3(0 * squareSize, (heightmap.data[(i * cols + j-1) * 4 + 0] / 256) * maxHeight - thisHeight, 1 * squareSize);
                normal = normal.add(v2.cross(v1).normalize()).add(v1.cross(v3).normalize());
                nCount += 2;
            }
            // upper right triangle
            if(i-1 >= 0 && i <= rows-1 && j >= 0 && j+1 <= cols-1) {
                v1 = new vec3(-1 * squareSize, (heightmap.data[((i-1) * cols + j) * 4 + 0] / 256) * maxHeight - thisHeight, 0 * squareSize);
                v2 = new vec3(0 * squareSize, (heightmap.data[(i * cols + j+1) * 4 + 0] / 256) * maxHeight - thisHeight, -1 * squareSize);
                normal = normal.add(v2.cross(v1).normalize());
                nCount ++;
            }
            // lower left triangle
            if(i >= 0 && i+1 <= rows-1 && j-1 >= 0 && j <= cols-1) {
                v1 = new vec3(0 * squareSize, (heightmap.data[(i * cols + j-1) * 4 + 0] / 256) * maxHeight - thisHeight, 1 * squareSize);
                v2 = new vec3(1 * squareSize, (heightmap.data[((i+1) * cols + j) * 4 + 0] / 256) * maxHeight - thisHeight, 0 * squareSize);
                normal = normal.add(v1.cross(v2).normalize());
                nCount ++;
            }
            // lower right square
            if(i >= 0 && i+1 <= rows-1 && j >= 0 && j+1 <= cols-1) {
                v1 = new vec3(1 * squareSize, (heightmap.data[((i+1) * cols + j) * 4 + 0] / 256) * maxHeight - thisHeight, 0 * squareSize);
                v2 = new vec3(1 * squareSize, (heightmap.data[((i+1) * cols + j+1) * 4 + 0] / 256) * maxHeight - thisHeight, -1 * squareSize);
                v3 = new vec3(0 * squareSize, (heightmap.data[(i * cols + j+1) * 4 + 0] / 256) * maxHeight - thisHeight, -1 * squareSize);
                normal = normal.add(v1.cross(v2).normalize()).add(v2.cross(v3).normalize());
                nCount += 2;
            }
            
            normal = normal.scale(1/nCount).normalize();
            normal = normal.scale(128).add(new vec3(128, 128, 128));
            normal = new vec3(Math.floor(normal.x), Math.floor(normal.y), Math.floor(normal.z));
            if(normal.x == 256) normal.x--;
            if(normal.y == 256) normal.y--;
            if(normal.z == 256) normal.z--;
            normal = new vec3(normal.x, normal.y, normal.z);    // to regenerate .xyz
            
            // write normals to texture; do bilinear interpolation in fragment shader
            mesh.normals.push(...normal.xyz);
            
            if(j < cols-1 && i < rows-1)
                mesh.indices.push(index, index + cols + 1, index + 1, index, index + cols, index + cols + 1);
            index ++;
        }
    }
    mesh.normals = new Uint8Array(mesh.normals);
    
    mesh.attribs = {};
    if(gl !== 'undefined') {
        let positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);
        
        mesh.normalTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, mesh.normalTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, cols, rows, 0, gl.RGB, gl.UNSIGNED_BYTE, mesh.normals);
        gl.generateMipmap(gl.TEXTURE_2D);
        
        let indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);
        
        mesh.attribs = {
            a_position: {buffer: positionBuffer, numComponents: 3}
        };
        mesh.indexBuffer = indexBuffer;
    }
    mesh.rows = rows;
    mesh.cols = cols;
    mesh.squareSize = squareSize;
    mesh.maxHeight = maxHeight;
    
    return mesh;
};