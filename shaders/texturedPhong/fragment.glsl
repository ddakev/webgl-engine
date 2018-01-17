precision mediump float;
precision mediump int;

struct Material {
    sampler2D   diffuse;
    sampler2D   specular;
    
    float       shininess;
};

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

varying vec2                v_uv;
varying vec3                v_normal;
varying vec3                v_position;
varying float               v_clipDistance;

uniform vec3                u_viewWorldPosition;
uniform int                 u_numDir;
uniform int                 u_numPoint;
uniform int                 u_numSpot;
uniform DirectionalLight    dirLights[5];
uniform PointLight          pointLights[10];
uniform SpotLight           spotLights[5];
uniform Material            material;

void main() {
    vec4 color = texture2D(material.diffuse, v_uv);
    gl_FragColor = vec4(0, 0, 0, 1);
    
    vec3 normal = normalize(v_normal);
    vec3 viewDir = normalize(u_viewWorldPosition - v_position);
    
    for(int i=0; i<5; i++) {
        if(i >= u_numDir) break;
        vec3 lightDir = normalize(-dirLights[i].direction);
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
        
        vec3 ambient = dirLights[i].ambientIntensity * dirLights[i].color * vec3(color);
        vec3 diffuse = dirLights[i].intensity * dirLights[i].color * diff * vec3(color);
        vec3 specular = dirLights[i].specularIntensity * spec * vec3(color);
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