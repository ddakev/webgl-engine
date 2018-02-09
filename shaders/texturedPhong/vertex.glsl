precision mediump float;
precision mediump int;

struct DirectionalLight {
    vec3        direction;
    vec3        color;
    
    float       intensity;
    float       ambientIntensity;
    float       specularIntensity;
    
    int         numCascades;
    sampler2D   shadowMapCascades[4];
    mat4        bModelViewProjections[4];
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

uniform int                 u_numPoint;
uniform int                 u_numSpot;
uniform DirectionalLight    dirLight;
uniform PointLight          pointLights[10];
uniform SpotLight           spotLights[5];
uniform vec3                u_viewWorldPosition;
uniform mat4                u_model;
uniform mat4                u_modelViewProjection;
uniform mat4                u_modelInverseTranspose;
uniform vec4                u_clipPlane;

varying vec2                v_uv;
varying vec3                v_normal;
varying vec3                v_position;
varying float               v_clipDistance;
varying vec3                v_shadowPositions[4];

void main() {
    gl_Position = u_modelViewProjection * a_position;
    v_uv = a_uv;
    v_normal = (u_modelInverseTranspose * vec4(a_normal, 0)).xyz;
    v_position = (u_model * a_position).xyz;
    v_clipDistance = dot(u_model * a_position, vec4(u_clipPlane.x, u_clipPlane.y, u_clipPlane.z, -u_clipPlane.w));
    
    for(int i=0; i<4; i++) {
        if(i >= dirLight.numCascades) break;
        v_shadowPositions[i] = vec3(dirLight.bModelViewProjections[i] * a_position);
    }
}