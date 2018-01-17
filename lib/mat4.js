/**
    4x4 Matrix class
    @prop mat   a 16-element array representing the 4x4 matrix
    
    Overloads:
    mat4(Array)     :   Matrix with values as specified in the array
    mat4()          :   Identity matrix
*/
function mat4(mat) {
    if(typeof mat == "undefined") {
        this.mat = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }
    else {
        this.mat = mat;
    }
}

/**
    Multiply by another matrix smat or by a scalar smat
*/
mat4.prototype.multiply = function(smat) {
    let res = [];
    if(smat instanceof mat4 || smat instanceof Array) {
        if(!smat instanceof mat4) {
            smat = new mat4(mat2);
        }
        for(let i=0; i<4; i++) {
            for(let j=0; j<4; j++) {
                let sum = 0;
                for(let k=0; k<4; k++) {
                    sum += this.mat[i*4+k] * smat.mat[k*4+j];
                }
                res.push(sum);
            }
        }
    }
    else if(smat instanceof vec4) {
        for(let i=0; i<4; i++) {
            let sum = 0;
            for(let j=0; j<4; j++) {
                sum += this.mat[j*4+i] * smat.xyzw[j];
            }
            res.push(sum);
        }
        return new vec4(res);
    }
    else {
        for(let i=0; i<16; i++) {
            res.push(this.mat[i] * smat);
        }
    }
    return new mat4(res);
};

/**
    Find the determinant
*/
mat4.prototype.determinant = function() {
    let sum = 0;
    let cofactor = this.cofactorMatrix();
    for(let i=0; i<4; i++) {
        sum += this.mat[i*4] * cofactor.mat[i*4];
    }
    return sum;
};

/**
    Find the cofactor matrix
*/
mat4.prototype.cofactorMatrix = function() {
    let res = [];
    for(let i=0; i<4; i++) {
        for(let j=0; j<4; j++) {
            let minor = [];
            for(let k=0; k<16; k++) {
                if(Math.floor(k/4) != i && k%4 != j) {
                    minor.push(this.mat[k]);
                }
            }
            let sign = (i&1)^(j&1) ? -1 : 1;
            res.push(sign * new mat3(minor).determinant());
        }
    }
    return new mat4(res);
};

/**
    Find the adjugate matrix
*/
mat4.prototype.adjugate = function() {
    return this.cofactorMatrix().transpose();
};

/**
    Find the inverse of a matrix
*/
mat4.prototype.inverse = function() {
    return this.adjugate().multiply(1/this.determinant());
};

/**
    Find the transpose of the inverse (to avoid taking the transpose twice when calling adjugate and then when taking the transpose of the inverse)
*/
mat4.prototype.inverseTranspose = function() {
    return this.cofactorMatrix().multiply(1/this.determinant());
}

/**
    Find the transpose of a matrix
*/
mat4.prototype.transpose = function() {
    return new mat4([
        this.mat[0], this.mat[4], this.mat[8], this.mat[12],
        this.mat[1], this.mat[5], this.mat[9], this.mat[13],
        this.mat[2], this.mat[6], this.mat[10], this.mat[14],
        this.mat[3], this.mat[7], this.mat[11], this.mat[15]
    ]);
};

/**
    Translate matrix by tx on x, ty on y, and tz on z
*/
mat4.prototype.translate = function(tx, ty, tz) {
    return this.multiply(mat4.translationMat(tx, ty, tz));
};

/**
    Rotate around axis by angle degrees
*/
mat4.prototype.rotate = function(axis, angle) {
    if(axis instanceof Number && (angle instanceof vec3 || angle instanceof Array)) {
        let temp = axis;
        axis = angle;
        angle = temp;
    }
    if(!axis instanceof vec3) {
        axis = new vec3(axis);
    }
    return this.multiply(mat4.rotationMat(axis, angle));
};

/**
    Rotate around x-axis by angle degrees
*/
mat4.prototype.xRotate = function(angle) {
    return this.multiply(mat4.xRotationMat(angle));
};

/**
    Rotate around y-axis by angle degrees
*/
mat4.prototype.yRotate = function(angle) {
    return this.multiply(mat4.yRotationMat(angle));
};

/**
    Rotate around z-axis by angle degrees
*/
mat4.prototype.zRotate = function(angle) {
    return this.multiply(mat4.zRotationMat(angle));
};

/**
    Rotate around all three axes
*/
mat4.prototype.rotateXYZ = function(ax, ay, az) {
    return this.xRotate(ax).yRotate(ay).zRotate(az);
};

/**
    Scale by sx on x, sy on y, and sz on z
*/
mat4.prototype.scale = function(sx, sy, sz) {
    return this.multiply(mat4.scalingMat(sx, sy, sz));
};

mat4.prototype.clearRotation = function() {
    return new mat4([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        this.mat[12], this.mat[13], this.mat[14], this.mat[15]
    ]);
};

/**
    Get the translation matrix for translation by tx, ty and tz
*/
mat4.translationMat = function(tx, ty, tz) {
    return new mat4([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        tx, ty, tz, 1
    ]);
};

/**
    Get a rotation matrix based on an axis and an angle
*/
mat4.rotationMat = function(axis, angle) {
    let quat = new vec4(axis, angle).quaternion();
    return new mat4([
        1 - 2*(quat.y ** 2 + quat.z ** 2),  2*(quat.x*quat.y + quat.z*quat.w),  2*(quat.x*quat.z - quat.y*quat.w),  0,
        2*(quat.x*quat.y - quat.z*quat.w),  1 - 2*(quat.x ** 2 + quat.z ** 2),  2*(quat.y*quat.z + quat.x*quat.w),  0,
        2*(quat.x*quat.z + quat.y*quat.w),  2*(quat.y*quat.z - quat.x*quat.w),  1 - 2*(quat.x ** 2 + quat.y ** 2),  0,
        0,                                  0,                                  0,                                  1
    ]);
};

/**
    Get the Euler x-rotation matrix for rotating by angle degrees
*/
mat4.xRotationMat = function(angle) {
    let c = Math.cos(angle * Math.PI / 180);
    let s = Math.sin(angle * Math.PI / 180);
    return new mat4([
        1, 0, 0, 0,
        0, c, s, 0,
        0, -s, c, 0,
        0, 0, 0, 1
    ]);
};

/**
    Get the Euler y-rotation matrix for rotating by angle degrees
*/
mat4.yRotationMat = function(angle) {
    let c = Math.cos(angle * Math.PI / 180);
    let s = Math.sin(angle * Math.PI / 180);
    return new mat4([
        c, 0, -s, 0,
        0, 1, 0, 0,
        s, 0, c, 0,
        0, 0, 0, 1
    ]);
};

/**
    Get the Euler z-rotation matrix for rotating by angle degrees
*/
mat4.zRotationMat = function(angle) {
    let c = Math.cos(angle * Math.PI / 180);
    let s = Math.sin(angle * Math.PI / 180);
    return new mat4([
        c, s, 0, 0,
        -s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
};

/**
    Get the scaling matrix for scaling by sx, sy, and sz
*/
mat4.scalingMat = function(sx, sy, sz) {
    return new mat4([
        sx, 0,  0,  0,
        0, sy,  0,  0,
        0,  0, sz,  0,
        0,  0,  0,  1
    ]);
};

/**
    Get the matrix for an orthographic camera with the specified left, right, bottom, top, near, and far bounds
*/
mat4.orthographic = function(left, right, bottom, top, near, far) {
    return new mat4([
        2 / (right - left), 0, 0, 0,
        0, 2 / (bottom - top), 0, 0,
        0, 0, 2 / (near - far), 0,
        -(right+left)/(right-left), -(bottom+top)/(bottom-top), (far+near) / (far-near), 1
    ]);
};

/**
    Get the matrix for a perspective camera with the specified field of view, aspect ratio, near and far bounds
*/
mat4.perspective = function(fieldOfView, aspect, near, far) {
    let f = 1 / Math.tan(0.5 * fieldOfView * Math.PI/180);
    return new mat4([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far+near) / (near-far), -1,
        0, 0, 2*far*near / (near-far), 0
    ]);
};

/**
    Get the transformation matrix to look at target from position cameraPosition, with the up direction
*/
mat4.lookAt = function(cameraPosition, target, up) {
    let zAxis = cameraPosition.subtract(target).normalize();
    let xAxis = up.cross(zAxis).normalize();
    let yAxis = zAxis.cross(xAxis).normalize();
    return new mat4([
        xAxis.x, xAxis.y, xAxis.z, 0,
        yAxis.x, yAxis.y, yAxis.z, 0,
        zAxis.x, zAxis.y, zAxis.z, 0,
        0, 0, 0, 1
    ]).multiply(new mat4([
        1, 0, 0, -cameraPosition.x,
        0, 1, 0, -cameraPosition.y,
        0, 0, 1, -cameraPosition.z,
        0, 0, 0, 1
    ]));
};