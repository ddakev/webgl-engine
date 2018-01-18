precision mediump float;
precision mediump int;

#define M_PI 3.14159265

struct Material {
    sampler2D   diffuse;
    sampler2D   specular;
    
    float       shininess;
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

varying vec2                v_uv;
varying vec3                v_normal;
varying vec3                v_position;
varying float               v_clipDistance;
varying vec3                v_shadowPositions[5];

uniform vec3                u_viewWorldPosition;
uniform int                 u_numDir;
uniform int                 u_numPoint;
uniform int                 u_numSpot;
uniform DirectionalLight    dirLights[5];
uniform PointLight          pointLights[10];
uniform SpotLight           spotLights[5];
uniform Material            material;
uniform sampler2D           u_offsets;
uniform float               u_strataSize;

const float offsetSize = 4.0;

float random(vec4 seed4) {
    float dot_product = dot(seed4, vec4(12.9898,78.233,45.164,94.673));
    return fract(sin(dot_product) * 43758.5453);
}

float predictShadow(sampler2D shadowMap, vec3 uv) {
    float total = 1.0;
    for(float i=0.0; i<offsetSize; i++) {
        vec4 jit = texture2D(u_offsets, vec2(random(vec4(uv.x))+(i/2.0)/offsetSize, random(vec4(uv.y))+1.0/offsetSize));
        float ju, jv;
        if(mod(i, 2.0) == 0.0) {
            ju = jit.x;
            jv = jit.y;
        }
        else {
            ju = jit.z;
            jv = jit.w;
        }
        float u = (i - offsetSize / 2.0 + ju) /offsetSize + 0.5;
        float v = (offsetSize / 2.0 + jv) /offsetSize + 0.5;
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
            vec4 jit = texture2D(u_offsets, vec2(uv.x+(i/2.0)/offsetSize, uv.y+j/offsetSize));
            float ju, jv;
            if(mod(i, 2.0) == 0.0) {
                ju = jit.x;
                jv = jit.y;
            }
            else {
                ju = jit.z;
                jv = jit.w;
            }
            float u = (i - offsetSize / 2.0 + ju) /offsetSize + 0.5;
            float v = (j - offsetSize / 2.0 + jv) /offsetSize + 0.5;
            float x = sqrt(v) * cos(2.0*M_PI*u);
            float y = sqrt(v) * sin(2.0*M_PI*u);

            if(texture2D(shadowMap, vec2(uv.x + x * u_strataSize, uv.y + y * u_strataSize)).r < uv.z)
                total -= 1.0 / (offsetSize * offsetSize);
        }
    }
    return total;
}

void main() {
    vec4 color = texture2D(material.diffuse, v_uv);
    gl_FragColor = vec4(0, 0, 0, 1);
    
    vec3 normal = normalize(v_normal);
    vec3 viewDir = normalize(u_viewWorldPosition - v_position);
    
    float visibility[5];
    float bias = 0.0;
    vec2 poissonDisk[4];
    poissonDisk[0] = vec2( -0.94201624, -0.39906216 );
    poissonDisk[1] = vec2( 0.94558609, -0.76890725 );
    poissonDisk[2] = vec2( -0.094184101, -0.92938870 );
    poissonDisk[3] = vec2( 0.34495938, 0.29387760 );
    
    float prediction;
    if(u_numDir > 0) {
        visibility[0] = 1.0;
        if(v_shadowPositions[0].x >= 0.0 && v_shadowPositions[0].x <= 1.0 && v_shadowPositions[0].y >= 0.0 && v_shadowPositions[0].y <= 1.0) {
            prediction = predictShadow(dirLights[0].shadowMap, v_shadowPositions[0]);
            if(prediction == 0.0 || prediction == 1.0) {
                visibility[0] = prediction / 2.0 + 0.5;
            }
            else {
                visibility[0] = stratSample(dirLights[0].shadowMap, v_shadowPositions[0], prediction) / 2.0 + 0.5;
            }
            /*for(int i=0; i<4; i++) {
                if(texture2D(dirLights[0].shadowMap, v_shadowPositions[0].xy + poissonDisk[i]/700.0).r < v_shadowPositions[0].z-bias)
                    visibility[0] = visibility[0] - 0.2;
            }*/
        }
        if(u_numDir > 1) {
            prediction = predictShadow(dirLights[1].shadowMap, v_shadowPositions[1]);
            if(prediction == 0.0 || prediction == 1.0) {
                visibility[1] = prediction / 2.0 + 0.5;
            }
            else {
                visibility[1] = stratSample(dirLights[1].shadowMap, v_shadowPositions[1], prediction) / 2.0 + 0.5;
            }
            if(u_numDir > 2) {
                prediction = predictShadow(dirLights[2].shadowMap, v_shadowPositions[2]);
                if(prediction == 0.0 || prediction == 1.0) {
                    visibility[2] = prediction / 2.0 + 0.5;
                }
                else {
                    visibility[2] = stratSample(dirLights[2].shadowMap, v_shadowPositions[2], prediction) / 2.0 + 0.5;
                }
                if(u_numDir > 3) {
                    prediction = predictShadow(dirLights[3].shadowMap, v_shadowPositions[3]);
                    if(prediction == 0.0 || prediction == 1.0) {
                        visibility[3] = prediction / 2.0 + 0.5;
                    }
                    else {
                        visibility[3] = stratSample(dirLights[3].shadowMap, v_shadowPositions[3], prediction) / 2.0 + 0.5;
                    }
                    if(u_numDir > 4) {
                        prediction = predictShadow(dirLights[1].shadowMap, v_shadowPositions[4]);
                        if(prediction == 0.0 || prediction == 1.0) {
                            visibility[4] = prediction / 2.0 + 0.5;
                        }
                        else {
                            visibility[4] = stratSample(dirLights[4].shadowMap, v_shadowPositions[4], prediction) / 2.0 + 0.5;
                        }
                    }
                }
            }
        }
    }
    
    for(int i=0; i<5; i++) {
        if(i >= u_numDir) break;
        vec3 lightDir = normalize(-dirLights[i].direction);
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
        
        vec3 ambient = dirLights[i].ambientIntensity * dirLights[i].color * vec3(color);
        vec3 diffuse = visibility[i] * dirLights[i].intensity * dirLights[i].color * diff * vec3(color);
        vec3 specular = visibility[i] * dirLights[i].specularIntensity * spec * vec3(color);
        gl_FragColor = gl_FragColor + vec4(ambient + diffuse + specular, 0.0);
    }
    
    for(int i=0; i<10; i++) {
        if(i >= u_numPoint) break;
        vec3 lightDir = normalize(pointLights[i].position - v_position);
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
        float distance = length(pointLights[i].position - v_position);
        float attenuation = 1.0 / (pointLights[i].constant + pointLights[i].linear * distance + pointLights[i].quadratic * (distance * distance));
        
        vec3 ambient = pointLights[i].ambientIntensity * pointLights[i].color * vec3(color);
        vec3 diffuse = pointLights[i].intensity * pointLights[i].color * diff * vec3(color);
        vec3 specular = pointLights[i].specularIntensity * spec * vec3(color);
        ambient *= attenuation;
        diffuse *= attenuation;
        specular *= attenuation;
        gl_FragColor = gl_FragColor + vec4(ambient + diffuse + specular, 0.0);
    }
    
    for(int i=0; i<5; i++) {
        if(i >= u_numSpot) break;
        vec3 lightDir = normalize(spotLights[i].position - v_position);
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
        float theta = dot(lightDir, normalize(-spotLights[i].direction));
        float epsilon = spotLights[i].innerCutoff - spotLights[i].outerCutoff;
        float intensity = clamp((theta - spotLights[i].outerCutoff) / epsilon, 0.0, 1.0);
        float distance = length(spotLights[i].position - v_position);
        float attenuation = 1.0 / (spotLights[i].constant + spotLights[i].linear * distance + spotLights[i].quadratic * (distance * distance));
        
        vec3 ambient = spotLights[i].ambientIntensity * spotLights[i].color * vec3(color);
        vec3 diffuse = spotLights[i].intensity * spotLights[i].color * diff * vec3(color);
        vec3 specular = spotLights[i].specularIntensity * spec * vec3(color);
        ambient *= attenuation;
        diffuse *= intensity * attenuation;
        specular *= intensity * attenuation;
        
        gl_FragColor = gl_FragColor + vec4(ambient + diffuse + specular, 0.0);
    }
}