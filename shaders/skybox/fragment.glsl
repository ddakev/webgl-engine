precision mediump float;
precision mediump int;

varying     vec3            v_texcoords;
uniform     samplerCube     cube_texture;

void main() {
    gl_FragColor = textureCube(cube_texture, v_texcoords);
}