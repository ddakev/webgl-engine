function Mesh(gl, model, material) {
    this.vertices = [];
    this.normals = [];
    this.uvs = [];
    this.indices = [];
    this.material = material || new Material(gl);
    this.attribs = {};
    
    if(model && model.format == "obj") {
        Mesh.importOBJ(this, model.data);
        this.setAttribs(gl);
    }
}

Mesh.prototype.setAttribs = function(gl) {
    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    this.attribs.a_position = {buffer: positionBuffer, numComponents: 3};
    
    if(this.normals.length != 0) {
        let normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
        this.attribs.a_normal = {buffer: normalBuffer, numComponents: 3};
    }
    
    if(this.uvs.length != 0) {
        let uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvs), gl.STATIC_DRAW);
        this.attribs.a_uv = {buffer: uvBuffer, numComponents: 2};
    }
    
    if(this.indices.length != 0) {
        let indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
        this.indexBuffer = indexBuffer;
    }
};

Mesh.importOBJ = function(mesh, model) {
    let vertices = [];
    let normals = [];
    let uvs = [];
    let objInd = -1;
    let nObj = 0;
    let modelText = model.split('\n');
    for(let i=0; i<modelText.length; i++) {
        if(modelText[i].split(' ')[0] == 'usemtl') nObj++;
    }
    let n = 1;
    while(n < nObj) n *= 2;
    nObj = n;
    for(let i=0; i<modelText.length; i++) {
        let lineItems = modelText[i].split(' ');
        if(lineItems[0] == 'v') {
            vertices.push([parseFloat(lineItems[1]), parseFloat(lineItems[2]), parseFloat(lineItems[3])]);
        }
        else if(lineItems[0] == 'vn') {
            normals.push([parseFloat(lineItems[1]), parseFloat(lineItems[2]), parseFloat(lineItems[3])]);
        }
        else if(lineItems[0] == 'vt') {
            uvs.push([parseFloat(lineItems[1]), parseFloat(lineItems[2])]);
        }
        else if(lineItems[0] == 'f') {
            for(let j=1; j<4; j++) {
                mesh.vertices.push(...vertices[parseInt(lineItems[j].split('/')[0])-1]);
                if(lineItems[j].split('/')[1] != '') {
                    mesh.uvs.push(...uvs[parseInt(lineItems[j].split('/')[1])-1]);
                }
                else {
                    mesh.uvs.push(objInd/nObj+1/(2*nObj), 0.0);
                }
                if(lineItems[j].split('/')[2] != '') {
                    mesh.normals.push(...normals[parseInt(lineItems[j].split('/')[2])-1]);
                }
            }
        }
        else if(lineItems[0] == 'usemtl') {
            objInd ++;
        }
    }
    if(mesh.normals.length == 0) {
        for(let i=0; i<mesh.vertices.length/3; i++) {
            mesh.normals.push(0, 1, 0);
        }
    }
    if(mesh.uvs.length == 0) {
        for(let i=0; i<mesh.vertices.length/3; i++) {
            mesh.uvs.push(0, 0);
        }
    }
};



function Sphere(gl, detail, material, radius) {
    Mesh.call(this, gl, null, material);
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
    
    if(typeof gl !== 'undefined') {
        this.setAttribs(gl);
    }
}
Sphere.prototype = Object.create(Mesh.prototype);
Sphere.prototype.constructor = Sphere;



function Cube(gl, size, material) {
    Mesh.call(this, gl, null, material);
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
    
    if(typeof gl !== 'undefined') {
        this.setAttribs(gl);
    }
}
Cube.prototype = Object.create(Mesh.prototype);
Cube.prototype.constructor = Cube;