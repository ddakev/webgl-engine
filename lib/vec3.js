/**
    Vector with 3 values
    @prop xyz   Array   3-element array containing the three values
    @prop x     Number  x value
    @prop y     Number  y value
    @prop z     Number  z value
    
    Overloads:
    vec3(Number, Number, Number)    :   Vector with specified x, y, and z values
    vec3(vec3)                      :   Vector copy of specified vector
    vec3(Array)                     :   Vector with x, y, and z values as specified in the array's positions 0, 1, and 2
    vec3(Number)                    :   Vector with all three values equal to the specified number
    vec3()                          :   Vector with all zeroes
*/
function vec3(x, y, z) {
    if(typeof x !== "undefined" &&
       typeof y !== "undefined" &&
       typeof z !== "undefined") {
        this.x = x;
        this.y = y;
        this.z = z;
        this.xyz = [x, y, z];
    }
    else if(typeof x !== "undefined") {
        if(x instanceof vec3) {
            this.xyz = x.xyz;
            this.x = this.xyz[0];
            this.y = this.xyz[1];
            this.z = this.xyz[2];
        }
        else if(x instanceof Array) {
            this.xyz = x;
            this.x = x[0];
            this.y = x[1];
            this.z = x[2];
        }
        else {
            this.x = x;
            this.y = x;
            this.z = x;
            this.xyz = [x, x, x];
        }
    }
    else {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.xyz = [0, 0, 0];
    }
}

/**
    Convert to vector with size 1
*/
vec3.prototype.normalize = function() {
    let length = this.norm();
    if(length > 0.00001) {
        return new vec3([this.x/length, this.y/length, this.z/length]);
    }
    else {
        return new vec3();
    }
};

/**
    Scale vector by a factor
*/
vec3.prototype.scale = function(factor) {
    return new vec3([
        this.x * factor,
        this.y * factor,
        this.z * factor
    ]);
}

/**
    Add vector svec to the current one
*/
vec3.prototype.add = function(svec) {
    return new vec3([this.x+svec.x, this.y+svec.y, this.z+svec.z]);
};

/**
    Subtract vector svec from current one
*/
vec3.prototype.subtract = function(svec) {
    return new vec3([this.x-svec.x, this.y-svec.y, this.z-svec.z]);
};

/**
    Find the cross product of the current vector and svec
*/
vec3.prototype.cross = function(svec) {
    return new vec3([
        this.y*svec.z - this.z*svec.y,
        this.z*svec.x - this.x*svec.z,
        this.x*svec.y - this.y*svec.x
    ]);
};

/**
    Find the dot product of the current vector and svec
*/
vec3.prototype.dot = function(svec) {
    return this.x*svec.x+this.y*svec.y+this.z*svec.z;
};

/**
    Get the norm of the current vector
*/
vec3.prototype.norm = function() {
    return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
};

vec3.UP = new vec3(0, 0, 1);
vec3.DOWN = new vec3(0, 0, -1);
vec3.RIGHT = new vec3(1, 0, 0);
vec3.LEFT = new vec3(-1, 0, 0);
vec3.FORWARD = new vec3(0, 1, 0);
vec3.BACK = new vec3(0, -1, 0);