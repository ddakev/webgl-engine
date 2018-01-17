precision mediump float;
precision mediump int;

struct Terrain {
    sampler2D   height;
    sampler2D   moisture;
    sampler2D   diffuse;
};
    
struct Biomes {
    sampler2D   sandDiffuse;
    sampler2D   sandNormal;
    sampler2D   grassDiffuse;
    sampler2D   grassNormal;
    sampler2D   forestDiffuse;
    sampler2D   forestNormal;
    sampler2D   snowDiffuse;
    sampler2D   snowNormal;
};

struct DirectionalLight {
    vec3    direction;
    vec3    color;
    
    float   intensity;
    float   ambientIntensity;
    float   specularIntensity;
};

//varying     vec3                v_normal;
varying     vec3                v_position;
varying     vec2                v_uv;
varying     float               v_clipDistance;
varying     vec3                v_dirLightDirection[5];

uniform     Terrain             u_terrain;
uniform     Biomes              u_biomes;
uniform     float               u_bFactor;
uniform     float               u_waterLevel;
uniform     vec3                u_viewWorldPosition;
uniform     int                 u_numDir;
uniform     DirectionalLight    dirLights[5];

const float atmLighting = 2.0;

void main() {
    if(v_clipDistance < 0.0) {
        discard;
    }
    float height = texture2D(u_terrain.height, v_uv).r;
    float moisture = texture2D(u_terrain.moisture, v_uv).r;
    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
    vec4 normalMapped = vec4(0.0, 0.0, 0.0, 1.0);
    if(height < 0.425) {
        color = texture2D(u_biomes.sandDiffuse, v_uv * u_bFactor);
        normalMapped = texture2D(u_biomes.sandNormal, v_uv * u_bFactor);
    }
    else if(height < 0.475) {
        color = texture2D(u_biomes.sandDiffuse, v_uv * u_bFactor) * (0.475 - height) / 0.05 + texture2D(u_biomes.grassDiffuse, v_uv * u_bFactor) * (height - 0.425) / 0.05;
        normalMapped = texture2D(u_biomes.sandNormal, v_uv * u_bFactor) * (0.475 - height) / 0.05 + texture2D(u_biomes.grassNormal, v_uv * u_bFactor) * (height - 0.425) / 0.05;
    }
    else if(height < 0.625) {
        color = texture2D(u_biomes.grassDiffuse, v_uv * u_bFactor);
        normalMapped = texture2D(u_biomes.grassNormal, v_uv * u_bFactor);
    }
    else if(height < 0.675) {
        color = texture2D(u_biomes.grassDiffuse, v_uv * u_bFactor) * (0.675 - height) / 0.05 + texture2D(u_biomes.forestDiffuse, v_uv * u_bFactor) * (height - 0.625) / 0.05;
        normalMapped = texture2D(u_biomes.grassNormal, v_uv * u_bFactor) * (0.675 - height) / 0.05 + texture2D(u_biomes.forestNormal, v_uv * u_bFactor) * (height - 0.625) / 0.05;
    }
    else if(height < 0.825) {
        color = texture2D(u_biomes.forestDiffuse, v_uv * u_bFactor);
        normalMapped = texture2D(u_biomes.forestNormal, v_uv * u_bFactor);
    }
    else if(height < 0.875) {
        color = texture2D(u_biomes.forestDiffuse, v_uv * u_bFactor) * (0.875 - height) / 0.05 + texture2D(u_biomes.snowDiffuse, v_uv * u_bFactor) * (height - 0.825) / 0.05;
        normalMapped = texture2D(u_biomes.forestNormal, v_uv * u_bFactor) * (0.875 - height) / 0.05 + texture2D(u_biomes.snowNormal, v_uv * u_bFactor) * (height - 0.825) / 0.05;
    }
    else {
        color = texture2D(u_biomes.snowDiffuse, v_uv * u_bFactor);
        normalMapped = texture2D(u_biomes.snowNormal, v_uv * u_bFactor);
    }
    //vec4 color = texture2D(u_terrain.diffuse, vec2(moisture, 1.0-height));
    
    vec3 normal = normalize(vec3(normalMapped.r * 2.0 - 1.0, normalMapped.g * 2.0 - 1.0, normalMapped.b * 2.0));
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    
    for(int i=0; i<5; i++) {
        if(i >= u_numDir) break;
        vec3 lightDir = normalize(-v_dirLightDirection[i]);
        float diff = max(dot(normal, lightDir), 0.0);
        
        vec3 ambient = dirLights[i].ambientIntensity * dirLights[i].color * vec3(color);
        vec3 diffuse = dirLights[i].intensity * dirLights[i].color * diff * vec3(color) * atmLighting;
        gl_FragColor = gl_FragColor + vec4(ambient + diffuse, 0.0);
    }
    
    if(v_position.y < u_waterLevel) {
        float underwaterDistance = distance(u_viewWorldPosition, v_position);
        if(u_viewWorldPosition.y > u_waterLevel) {
            underwaterDistance = underwaterDistance * (u_waterLevel - v_position.y) / (u_viewWorldPosition.y - v_position.y);
        }
        gl_FragColor = mix(gl_FragColor, vec4(0.0, 0.3, 0.5, 1.0), clamp(underwaterDistance / 10.0, 0.0, 1.0));
    }
    //gl_FragColor = vec4(normal, 1.0);
}