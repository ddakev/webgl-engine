precision mediump float;
precision mediump int;

attribute   vec3    a_position;
varying     vec3    v_texcoords;
uniform     mat4    u_viewProjection;

void main() {
    v_texcoords = a_position;
    gl_Position = u_viewProjection * vec4(a_position, 1.0);
}