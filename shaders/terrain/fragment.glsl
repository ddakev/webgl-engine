precision mediump float;
precision mediump int;

#define M_PI 3.14159265

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
    vec3        direction;
    vec3        color;
    
    float       intensity;
    float       ambientIntensity;
    float       specularIntensity;
    
    int         numCascades;
    sampler2D   shadowMapCascades[4];
    mat4        bModelViewProjections[4];
};

//varying     vec3                v_normal;
varying     vec3                v_position;
varying     vec2                v_uv;
varying     float               v_clipDistance;
varying     vec3                v_dirLightDirection;
varying     vec3                v_shadowPositions[4];

uniform     Terrain             u_terrain;
uniform     Biomes              u_biomes;
uniform     float               u_bFactor;
uniform     float               u_waterLevel;
uniform     vec3                u_viewWorldPosition;
uniform     DirectionalLight    dirLight;
uniform     sampler2D           u_offsets;
uniform     float               u_strataSize;

const float offsetSize = 4.0;

float random(vec4 seed4) {
    float dot_product = dot(seed4, vec4(12.9898,78.233,45.164,94.673));
    return fract(sin(dot_product) * 43758.5453);
}

float predictShadow(sampler2D shadowMap, vec3 uv) {
    float total = 1.0;
    for(float i=0.0; i<offsetSize; i++) {
        vec2 jit = texture2D(u_offsets, vec2(i/offsetSize, (offsetSize-1.0)/offsetSize)).xy;
        float u = (i - offsetSize / 2.0 + jit.x) /offsetSize + 0.5;
        float v = (offsetSize / 2.0 + jit.y) /offsetSize + 0.5;
        float x = sqrt(v) * cos(2.0*M_PI*u);
        float y = sqrt(v) * sin(2.0*M_PI*u);
        
        if(texture2D(shadowMap, vec2(uv.x + x * u_strataSize, uv.y + y * u_strataSize)).r < uv.z)
            total -= 1.0 / offsetSize;
    }
    return total;
}

float stratSample(sampler2D shadowMap, vec3 uv, float prediction) {
    float total = 1.0 - (1.0 - prediction) / offsetSize;
    for(float i=0.0; i<offsetSize; i++) {
        for(float j=0.0; j<offsetSize-1.0; j++) {
            vec2 jit = texture2D(u_offsets, vec2(random(vec4(uv.x))+i/offsetSize, random(vec4(uv.y))+j/offsetSize)).xy;
            float u = (i - offsetSize / 2.0 + jit.x) /offsetSize + 0.5;
            float v = (j - offsetSize / 2.0 + jit.y) /offsetSize + 0.5;
            float x = sqrt(v) * cos(2.0*M_PI*u);
            float y = sqrt(v) * sin(2.0*M_PI*u);

            if(texture2D(shadowMap, vec2(uv.x + x * u_strataSize, uv.y + y * u_strataSize)).r < uv.z)
                total -= 1.0 / (offsetSize * offsetSize);
        }
    }
    return total;
}

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
    
    float visibility;
    float bias = 0.0;
    vec2 poissonDisk[4];
    poissonDisk[0] = vec2( -0.94201624, -0.39906216 );
    poissonDisk[1] = vec2( 0.94558609, -0.76890725 );
    poissonDisk[2] = vec2( -0.094184101, -0.92938870 );
    poissonDisk[3] = vec2( 0.34495938, 0.29387760 );
    
    float prediction;
    visibility = 1.0;
    for(int i=0; i<4; i++) {
        if(i >= dirLight.numCascades) break;
        if(v_shadowPositions[i].x >= 0.0 && v_shadowPositions[i].x <= 1.0 && v_shadowPositions[i].y >= 0.0 && v_shadowPositions[i].y <= 1.0) {
            prediction = predictShadow(dirLight.shadowMapCascades[i], v_shadowPositions[i]);
            if(prediction == 0.0 || prediction == 1.0) {
                visibility = prediction / 2.0 + 0.5;
            }
            else {
                visibility = stratSample(dirLight.shadowMapCascades[i], v_shadowPositions[i], prediction) / 2.0 + 0.5;
            }
            /*if(texture2D(dirLight.shadowMapCascades[i], v_shadowPositions[i].xy).r < v_shadowPositions[i].z - bias) {
                visibility = 0.5;
            }*/
            break;
            /*for(int i=0; i<4; i++) {
                if(texture2D(dirLights[0].shadowMap, v_shadowPositions[0].xy + poissonDisk[i]/700.0).r < v_shadowPositions[0].z-bias)
                    visibility[0] = visibility[0] - 0.2;
            }*/
        }
    }
        
    vec3 lightDir = normalize(-v_dirLightDirection);
    float diff = max(dot(normal, lightDir), 0.0);

    vec3 ambient = dirLight.ambientIntensity * dirLight.color * vec3(color);
    vec3 diffuse = visibility * dirLight.intensity * dirLight.color * diff * vec3(color);
    gl_FragColor = gl_FragColor + vec4(ambient + diffuse, 0.0);
    
    if(v_position.y <= u_waterLevel) {
        float underwaterDistance = distance(u_viewWorldPosition, v_position);
        if(u_viewWorldPosition.y > u_waterLevel) {
            underwaterDistance = underwaterDistance * (u_waterLevel - v_position.y) / (u_viewWorldPosition.y - v_position.y);
        }
        gl_FragColor = mix(gl_FragColor, vec4(0.0, 0.3, 0.5, 1.0), clamp(underwaterDistance / 30.0, 0.0, 1.0));
    }
    //gl_FragColor = vec4(vec3(texture2D(dirLights[0].shadowMap, v_shadowPositions[0].xy)), 1.0);
    //gl_FragColor = vec4(vec3(-v_shadowPositions[0].z), 1.0);
    //gl_FragColor = vec4(normal, 1.0);
}