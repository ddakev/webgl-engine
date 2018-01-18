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

uniform vec3                u_color;
uniform sampler2D           u_reflectionTexture;
uniform sampler2D           u_refractionTexture;
uniform sampler2D           u_refractionDepth;
uniform sampler2D           u_dudvMap;
uniform sampler2D           u_normalMap;
uniform float               u_moveFactor;
uniform float               u_shininess;
uniform float               u_reflectivity;
uniform float               u_near;
uniform float               u_far;
uniform int                 u_numDir;
uniform DirectionalLight    dirLights[5];

varying vec4                v_clipSpace;
varying vec3                v_toCamera;
varying vec3                v_toCameraTangent;
varying vec2                v_texCoords;
varying vec3                v_dirLightDirection[5];

const   float   waveStrength = 0.02;

void main() {
    vec2 coords = (v_clipSpace.xy / v_clipSpace.w) / 2.0 + 0.5;
    
    float depth = texture2D(u_refractionDepth, coords).r;
    float floorDistance = 2.0 * u_near * u_far / (u_far + u_near - (2.0 * depth - 1.0) * (u_far - u_near));
    
    depth = gl_FragCoord.z;
    float waterDistance = 2.0 * u_near * u_far / (u_far + u_near - (2.0 * depth - 1.0) * (u_far - u_near));
    float waterDepth = floorDistance - waterDistance;
    
    vec2 distortedTexCoords = texture2D(u_dudvMap, vec2(v_texCoords.x + u_moveFactor, v_texCoords.y)).rg;
    distortedTexCoords = v_texCoords + vec2(distortedTexCoords.x, distortedTexCoords.y + u_moveFactor);
    vec2 distortion = ((texture2D(u_dudvMap, distortedTexCoords).rg)* 2.0 - 1.0) * waveStrength * clamp(waterDepth/5.0, 0.0, 1.0);
    
    vec2 refractCoords = clamp(vec2(coords.x, coords.y) + distortion, 0.001, 0.999);
    vec2 reflectCoords = clamp(vec2(coords.x, 1.0-coords.y) + distortion, 0.001, 0.999);
    
    if(gl_FrontFacing) {
        vec4 refractColor = texture2D(u_refractionTexture, refractCoords);
        vec4 reflectColor = texture2D(u_reflectionTexture, reflectCoords);

        vec3 normal = texture2D(u_normalMap, distortedTexCoords).rgb;
        normal = normalize(vec3(normal.r * 2.0 - 1.0, normal.g * 2.0 - 1.0, normal.b * 2.0 - 1.0));

        float refractFactor = dot(normalize(v_toCamera), vec3(0.0, 1.0, 0.0));
        refractFactor = pow(refractFactor, 1.1);
        refractFactor = clamp(refractFactor, 0.001, 0.999);
        gl_FragColor = mix(mix(reflectColor, refractColor, refractFactor), vec4(0.0, 0.3, 0.5, 1.0), 0.2);

        for(int i=0; i<5; i++) {
            if(i >= u_numDir) break;
            vec3 reflectedLight = reflect(normalize(-v_dirLightDirection[i]), normal);
            float spec = pow(max(dot(reflectedLight, normalize(v_toCameraTangent)), 0.0), u_shininess);

            vec3 specular = dirLights[i].color * spec * u_reflectivity * clamp(waterDepth/5.0, 0.0, 1.0);
            gl_FragColor = gl_FragColor + vec4(specular, 0.0);
        }
        gl_FragColor = gl_FragColor * clamp(waterDepth/3.0, 0.0, 1.0);
        gl_FragColor.a = clamp(waterDepth/3.0, 0.0, 1.0);
    }
    else {
        gl_FragColor = mix(texture2D(u_refractionTexture, refractCoords), vec4(0.0, 0.3, 0.5, 1.0), clamp(waterDistance / 10.0, 0.0, 1.0));
    }
}