precision mediump float;
precision mediump int;

struct DirectionalLight {
    vec3        direction;
    vec3        color;
    
    float       intensity;
    float       ambientIntensity;
    float       specularIntensity;
    
    sampler2D   shadowMap;
    mat4        bModelViewProjection;
};

attribute   vec3    a_position;

uniform     mat4            u_model;
uniform     mat4            u_modelViewProjection;
uniform     mat4            u_modelInverseTranspose;
uniform     vec3            u_cameraPosition;
uniform     float           u_texFactor;
uniform int                 u_numDir;
uniform DirectionalLight    dirLights[5];

varying     vec4    v_clipSpace;
varying     vec3    v_toCamera;
varying     vec3    v_toCameraTangent;
varying     vec2    v_texCoords;
varying     vec3    v_dirLightDirection[5];

void main() {
    v_clipSpace = u_modelViewProjection * vec4(a_position, 1.0);
    
    vec3 normal = vec3(0.0, 1.0, 0.0);
    vec3 tangent = vec3(1.0, 0.0, 0.0);
    normal = (u_modelInverseTranspose * vec4(normal, 1.0)).xyz;
    tangent = (u_modelInverseTranspose * vec4(tangent, 1.0)).xyz;
    vec3 bitangent = cross(normal, tangent);
    
    mat3 tbnMatrix = mat3(
        tangent.x, bitangent.x, normal.x,
        tangent.y, bitangent.y, normal.y,
        tangent.z, bitangent.z, normal.z
    );
    
    for(int i=0; i<5; i++) {
        if(i >= u_numDir) break;
        v_dirLightDirection[i] = normalize(-dirLights[i].direction * tbnMatrix);
    }
    
    gl_Position = v_clipSpace;
    v_toCamera = u_cameraPosition - vec3((u_model * vec4(a_position, 1.0)));
    v_toCameraTangent = (u_cameraPosition - (u_model * vec4(a_position, 1.0)).xyz) * tbnMatrix;
    v_texCoords = (vec2(a_position.x, -a_position.z) * 2.0 + 0.5) * u_texFactor;
}