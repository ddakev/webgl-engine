/**
    Vector with 4 values
    @prop xyzw  Array   array representing the x, y, z, and w values
    @prop xyz   vec3    vector representing the x, y, and z values
    @prop x     Number  x value
    @prop y     Number  y value
    @prop z     Number  z value
    @prop w     Number  w value
    
    Overloads:
    vec4(Number, Number, Number, Number)    :   Vector with specified x, y, z, and w values
    vec4(vec3, Number)                      :   Vector with x, y, and z values as specified in vector, and w value as specified
    vec4(Array, Number)                     :   Vector with x, y, and z values as specified in array, and w value as specified
    vec4(Number, vec3)                      :   Vector with x, y, and z values as specified in vector, and w value as specified
    vec4(Number, Array)                     :   Vector with x, y, and z values as specified in array, and w value as specified
    vec4(vec4)                              :   Vector copy of specified vector
    vec4(Array)                             :   Vector with x, y, z, and w values as specified in array
    vec4(Number)                            :   Vector with all four values equal to the specified number
    vec4()                                  :   Vector with all zeroes
*/
function vec4(x, y, z, w) {
    if(typeof x !== "undefined" &&
       typeof y !== "undefined" &&
       typeof z !== "undefined" &&
       typeof w !== "undefined") {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        this.xyz = new vec3([x, y, z]);
        this.xyzw = [x, y, z, w];
    }
    else if(typeof x !== "undefined" &&
            typeof y !== "undefined") {
        if(x instanceof Array || x instanceof vec3) {
            let val = x;
            if(val instanceof vec3) val = val.xyz;
            this.xyz = new vec3(val);
            this.xyzw = val.concat(y);
            this.x = val[0];
            this.y = val[1];
            this.z = val[2];
            this.w = y;
        }
        else {
            let val = y;
            if(val instanceof vec3) val = val.xyz;
            this.xyz = new vec3(val);
            this.xyzw = val.concat(x);
            this.x = val[0];
            this.y = val[1];
            this.z = val[2];
            this.w = x;
        }
    }
    else if(typeof x !== "undefined"){
        if(x instanceof Array || x instanceof vec4) {
            let val = x;
            if(val instanceof vec4) val = val.xyzw;
            this.xyz = new vec3(val.slice(0, 3));
            this.xyzw = val;
            this.x = val[0];
            this.y = val[1];
            this.z = val[2];
            this.w = val[3];
        }
        else if(x instanceof Number) {
            this.x = x;
            this.y = x;
            this.z = x;
            this.w = x;
            this.xyz = new vec3([x, x, x]);
            this.xyzw = [x, x, x, x];
        }
    }
    else {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 0;
        this.xyz = new vec3();
        this.xyzw = [0, 0, 0, 0];
    }
}

/**
    Normalize current vector
*/
vec4.prototype.normalize = function() {
    if(this.norm() > 0.00001) {
        return this.scale(1/this.norm());
    }
    else {
        return new vec4();
    }
};

/**
    Add another vec4 to the current vector
*/
vec4.prototype.add = function(nvec) {
    return new vec4([
        this.x + nvec.x,
        this.y + nvec.y,
        this.z + nvec.z,
        this.w + nvec.w
    ]);
};

/**
    Substract another vec4 from the current vector
*/
vec4.prototype.subtract = function(nvec) {
    return new vec4([
        this.x - nvec.x,
        this.y - nvec.y,
        this.z - nvec.z,
        this.w - nvec.w
    ]);
};

/**
    Scale current vector by factor
*/
vec4.prototype.scale = function(factor) {
    return new vec4([
        this.x * factor,
        this.y * factor,
        this.z * factor,
        this.w * factor
    ]);
};

/**
    Find the dot product of the current and another vector
*/
vec4.prototype.dot = function(nvec) {
    return this.x * nvec.x + this.y * nvec.y + this.z * nvec.z + this.w * nvec.w;
};

/**
    Find the conjugate of the quaternion represented by the current vector
*/
vec4.prototype.conjugate = function() {
    return new vec4([
        -this.x,
        -this.y,
        -this.z,
        this.w
    ]);
};

/**
    Find the inverse of the quaternion represented by the current vector
*/
vec4.prototype.inverse = function() {
    return this.conjugate().scale(1/(this.norm() ** 2));
};

/**
    Multiply the quaternion represented by the current vector by a quaternion represented by another vector
*/
vec4.prototype.quatMultiply = function(nvec) {
    return new vec4([
        nvec.xyz.scale(this.w).add(this.xyz.scale(nvec.w)).add(this.xyz.cross(nvec.xyz)),
        this.w * nvec.w - this.xyz.dot(nvec.xyz)
    ]).normalize();
};

/**
    Find the quaternion representation of the current vector where xyz is the axis and w is the angle in degrees
*/
vec4.prototype.quaternion = function() {
    let axis = this.xyz.normalize();
    let angle = this.w * Math.PI / 180;
    let s = Math.sin(angle / 2);
    let c = Math.cos(angle / 2);
    return new vec4([
        axis.x * s,
        axis.y * s,
        axis.z * s,
        c
    ]);
};

/**
    Find the norm of the current vector
*/
vec4.prototype.norm = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
};