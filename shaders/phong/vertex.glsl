attribute vec4 a_position;
attribute vec3 a_color;
attribute vec3 a_normal;

uniform vec3 u_lightPosition;
uniform vec3 u_viewWorldPosition;
uniform mat4 u_model;
uniform mat4 u_modelViewProjection;
uniform mat4 u_modelInverseTranspose;

varying vec3 v_color;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

void main() {
    gl_Position = u_modelViewProjection * a_position;
    v_color = a_color;
    v_normal = (u_modelInverseTranspose * vec4(a_normal, 0)).xyz;
    
    vec3 surfaceModelPosition = (u_model * a_position).xyz;
    v_surfaceToLight = u_lightPosition - surfaceModelPosition;
    v_surfaceToView = normalize(u_viewWorldPosition - surfaceModelPosition);
}