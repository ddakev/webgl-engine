precision mediump float;
precision mediump int;

struct Terrain {
    sampler2D   height;
    sampler2D   moisture;
    sampler2D   diffuse;
};

struct DirectionalLight {
    vec3        direction;
    vec3        color;
    
    float       intensity;
    float       ambientIntensity;
    float       specularIntensity;
    
    sampler2D   shadowMap;
    mat4        bModelViewProjection;
};

attribute   vec3        a_position;
attribute   vec3        a_normal;

uniform     Terrain             u_terrain;
uniform     float               u_colsFactor;
uniform     float               u_rowsFactor;
uniform     vec3                u_viewWorldPosition;
uniform     mat4                u_model;
uniform     mat4                u_modelViewProjection;
uniform     mat4                u_modelInverseTranspose;
uniform     vec4                u_clipPlane;
uniform     sampler2D           u_normalTexture;
uniform     int                 u_numDir;
uniform     DirectionalLight    dirLights[3];

//varying     vec3        v_normal;
varying     vec3        v_position;
varying     vec2        v_uv;
varying     float       v_clipDistance;
varying     vec3        v_dirLightDirection[3];
varying     vec3        v_shadowPositions[3];

void main() {
    v_clipDistance = dot(u_model * vec4(a_position, 1.0), vec4(u_clipPlane.x, u_clipPlane.y, u_clipPlane.z, -u_clipPlane.w));
    gl_Position = u_modelViewProjection * vec4(a_position, 1.0);
    v_position = vec3(u_model * vec4(a_position, 1.0));
    v_uv = vec2(-a_position.z * u_colsFactor, a_position.x * u_rowsFactor);
    
    vec3 normal = texture2D(u_normalTexture, v_uv).xyz;
    normal = normalize(vec3(normal.x * 2.0 - 1.0, normal.y, normal.z * 2.0 - 1.0));
    vec3 tangent = normalize(cross(vec3(0.0, 0.0, 1.0), normal));
    normal = (u_modelInverseTranspose * vec4(normal, 1.0)).xyz;
    tangent = (u_modelInverseTranspose * vec4(tangent, 1.0)).xyz;
    vec3 bitangent = cross(normal, tangent);
    
    mat3 tbnMatrix = mat3(
        tangent.x, bitangent.x, normal.x,
        tangent.y, bitangent.y, normal.y,
        tangent.z, bitangent.z, normal.z
    );
    
    for(int i=0; i<3; i++) {
        if(i >= u_numDir) break;
        v_dirLightDirection[i] = normalize(dirLights[i].direction * tbnMatrix);
        v_shadowPositions[i] = vec3(dirLights[i].bModelViewProjection * vec4(a_position, 1.0));
    }
    //v_normal = (u_modelInverseTranspose * vec4(a_normal, 0)).xyz;
}