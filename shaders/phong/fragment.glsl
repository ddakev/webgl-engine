precision mediump float;

varying vec3 v_color;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

uniform float u_shininess;
uniform float u_intensity;
uniform float u_ambientIntensity;
//uniform vec3 u_reverseLightDirection;

void main() {
    vec4 color = vec4(v_color, 1);
    
    vec3 normal = normalize(v_normal);
    vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
    float light = dot(normal, surfaceToLightDirection);
    if(light < 0.0) {
        light = 0.0;
    }
    float specular = 0.0;
    if(light > 0.0) {
        specular = pow(dot(normal, halfVector), u_shininess) * u_intensity;
    }
    
    gl_FragColor = vec4(color.rgb * u_ambientIntensity + color.rgb * light + specular, color.a);
}