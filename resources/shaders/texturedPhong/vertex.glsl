precision mediump float;
precision mediump int;

struct DirectionalLight {
    vec3    direction;
    vec3    color;
    
    float   intensity;
    float   ambientIntensity;
    float   specularIntensity;
};

struct PointLight {
    vec3    position;
    vec3    color;
    
    float   intensity;
    float   ambientIntensity;
    float   specularIntensity;
    float   constant;
    float   linear;
    float   quadratic;
};

struct SpotLight {
    vec3    position;
    vec3    direction;
    vec3    color;
    
    float   intensity;
    float   ambientIntensity;
    float   specularIntensity;
    float   innerCutoff;
    float   outerCutoff;
    float   constant;
    float   linear;
    float   quadratic;
};

attribute vec4              a_position;
attribute vec2              a_uv;
attribute vec3              a_normal;

uniform int                 u_numDir;
uniform int                 u_numPoint;
uniform int                 u_numSpot;
uniform DirectionalLight    dirLights[5];
uniform PointLight          pointLights[10];
uniform SpotLight           spotLights[5];
uniform vec3                u_viewWorldPosition;
uniform mat4                u_model;
uniform mat4                u_modelViewProjection;
uniform mat4                u_modelInverseTranspose;

varying vec2                v_uv;
varying vec3                v_normal;
varying vec3                v_position;

void main() {
    gl_Position = u_modelViewProjection * a_position;
    v_uv = a_uv;
    v_normal = (u_modelInverseTranspose * vec4(a_normal, 0)).xyz;
    v_position = (u_model * a_position).xyz;
}