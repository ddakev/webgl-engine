function Material(gl, props = {}) {
    let diffuseImage = props.diffuse || new Uint8Array([97, 61, 235, 255]);
    if(diffuseImage instanceof Array) {
        diffuseImage = new Uint8Array(diffuseImage);
    }
    let specularImage = props.specular || new Uint8Array([255, 255, 255, 255]);
    if(specularImage instanceof Array) {
        specularImage = new Uint8Array(specularImage);
    }
    this.shininess = props.shininess || 128;
    
    this.diffuse = null;
    if(typeof gl !== 'undefined') {
        this.diffuse = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.diffuse);
        if(diffuseImage instanceof Uint8Array) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, diffuseImage.length / 4, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, diffuseImage);
        }
        else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, diffuseImage);
        }
        gl.generateMipmap(gl.TEXTURE_2D);
    }
    
    this.specular = null;
    if(typeof gl !== 'undefined') {
        this.specular = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.specular);
        if(specularImage instanceof Uint8Array) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, specularImage.length / 4, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, specularImage);
        }
        else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, specularImage);
        }
        gl.generateMipmap(gl.TEXTURE_2D);
    }
}

Material.prototype.setUniforms = function(programInfo) {
    let prefix = "material.";
    let uniforms = {};
    uniforms[prefix + "diffuse"] = this.diffuse;
    uniforms[prefix + "specular"] = this.specular;
    uniforms[prefix + "shininess"] = this.shininess;
    setUniforms(programInfo.uniformSetters, uniforms);
};