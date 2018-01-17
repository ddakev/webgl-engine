function Sphere(gl, detail, material, radius) {
    this.vertices = [];
    this.normals = [];
    this.uvs = [];
    this.indices = [];
    this.material = material || new Material(gl);
    let det = typeof detail === 'undefined' ? 32 : detail;
    let step = 360/det;
    let rad = typeof radius === 'undefined' ? 0.5 : radius;
    
    for(let phi = 0; phi <= 180; phi += step) {
        for(let th = 0; th <= 360; th += step) {
            let vx = rad * Math.sin(phi*Math.PI/180) * Math.cos(th*Math.PI/180);
            let vy = rad * Math.cos(phi*Math.PI/180);
            let vz = rad * Math.sin(phi*Math.PI/180) * Math.sin(th*Math.PI/180);
            
            let n = new vec3([vx, vy, vz]).normalize().xyz;
            
            let u = -th / 360;
            let v = phi / 180;
            
            this.vertices = this.vertices.concat([vx, vy, vz]);
            this.normals = this.normals.concat(n);
            this.uvs = this.uvs.concat([u, v]);
        }
    }
    
    let offset = det+1;
    for(let i=1; i<=180/step; i++) {
        for(let j=0; j<360/step; j++) {
            let i11 = Math.max(offset + j - det-1, 0);
            let i12 = Math.max(offset+j+1 - det-1, 0);
            let i21 = Math.min(offset + j, this.vertices.length/3-1);
            let i22 = Math.min(offset + j + 1, this.vertices.length/3-1);
            
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
    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    
    let normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
    
    let uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvs), gl.STATIC_DRAW);
    
    let indexBuffer = gl.createBuffer();
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
    let rad = typeof size === 'undefined' ? 0.5 : size/2;
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
    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    
    let normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
    
    let uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvs), gl.STATIC_DRAW);
    
    let indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
    
    this.attribs = {
        a_position: {buffer: positionBuffer, numComponents: 3},
        a_normal: {buffer: normalBuffer, numComponents: 3},
        a_uv: {buffer: uvBuffer, numComponents: 2}
    };
    this.indexBuffer = indexBuffer;
};