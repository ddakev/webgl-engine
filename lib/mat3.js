// I'm too lazy to implement all the functions right now
function mat3(mat) {
    if(typeof mat == "undefined") {
        this.mat = [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ];
    }
    else {
        this.mat = mat;
    }
}

mat3.prototype.determinant = function() {
    return this.mat[0]*this.mat[4]*this.mat[8]
            + this.mat[1]*this.mat[5]*this.mat[6]
            + this.mat[2]*this.mat[3]*this.mat[7]
            - this.mat[0]*this.mat[5]*this.mat[7]
            - this.mat[1]*this.mat[3]*this.mat[8]
            - this.mat[2]*this.mat[4]*this.mat[6];
};