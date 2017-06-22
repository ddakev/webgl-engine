var canvas;
var gl;
var WIDTH;
var HEIGHT;
var url = "http://localhost:8080";

var resources = {
    images: {
        "earth.jpg": null
    }
};
var programs = {
    texturedPhong: {
        vertexSource: "/resources/shaders/texturedPhong/vertex.glsl",
        fragmentSource: "/resources/shaders/texturedPhong/fragment.glsl"
    }
};
var camera;
var lightDir;
var lightLoc;

var gameObjects = [];
var dirLights = [];
var pointLights = [];
var spotLights = [];
var root;
var center;
var centerCube;
var cubeOrbit;
var orbitCube;
var lightCube;

window.addEventListener("load", function(e) {
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;
    canvas = document.getElementById("webgl");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    gl = canvas.getContext('webgl');
    
    Promise.all([
        loadResources(resources),
        makePrograms(gl, programs)
    ]).then(function(values) {
        init();
    }).catch(function(reason) {
        console.log(reason);
    });
});

function init() {
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    
    lightDir = [0.5, 0.7, 1];
    lightLoc = [1, 1, -1];
    
    root = new GameObject();
    center = new GameObject();
    centerCube = new GameObject(programs.texturedPhong, new Sphere(gl, 32, new Material(gl, {diffuse: resources.images["earth.jpg"], shininess: 16})));
    cubeOrbit = new GameObject();
    orbitCube = new GameObject(programs.texturedPhong, new Cube(gl));
    lightCube = new GameObject(programs.texturedPhong, new Cube(gl, 0.1, new Material(gl, {diffuse: [26, 255, 102, 255]})));
    camera = new PerspectiveCamera({
        fov:    45,
        aRatio: gl.canvas.clientWidth / gl.canvas.clientHeight,
        near:   1,
        far:    2000
    });
    var light = new PointLight([0,0,0], {
        ambientIntensity:   0.15,
        range:              200,
        intensity:          2,
        specularIntensity:  0.4
    });
    var light2 = new SpotLight([0, 0, 0], [0, 0, -1], {
        ambientIntensity:   0.3,
        linear:             0.01,
        quadratic:          0.015,
        intensity:          2,
        specularIntensity:  0.4,
        innerCutoff:        0,
    });
    
    camera.setParent(root);
    light.setParent(root);
    light2.setParent(root);
    lightCube.setParent(root);
    center.setParent(root);
    centerCube.setParent(center);
    cubeOrbit.setParent(center);
    orbitCube.setParent(cubeOrbit);
    
    center.applyTransformations(new mat4().translate(0,0,-3));
    cubeOrbit.applyTransformations(new mat4().translate(2,0,0).zRotate(30));
    lightCube.applyTransformations(new mat4().translate(lightLoc[0], lightLoc[1], lightLoc[2]));
    
    gameObjects.push(lightCube);
    gameObjects.push(centerCube);
    gameObjects.push(orbitCube);
    
    camera.applyTransformations(new mat4().translate(0, 0, 2));
    camera.lookAt(centerCube);
    
    light.applyTransformations(new mat4().translate(1, 1, -1));
    pointLights.push(light);
    spotLights.push(light2);
    
    drawScene();
}

function drawScene(time) {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    for(var i=0; i<gameObjects.length; i++) {
        gameObjects[i].draw(gl, camera);
    }
    
    cubeOrbit.applyTransformations(new mat4().rotate([-1, 2, 0], 0.5));
    orbitCube.applyTransformations(new mat4().xRotate(0.3).yRotate(0.3).zRotate(0.3));
    centerCube.applyTransformations(new mat4().yRotate(-0.2));
    window.requestAnimationFrame(drawScene);
}

function loadSource(filename) {
    return new Promise(function(resolve, reject) {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if(xhttp.readyState == 4) {
                if(xhttp.status == 200) {
                    resolve(xhttp.responseText);
                }
                else {
                    reject("Error getting resource " + filename);
                }
            }
        }
        xhttp.open("GET", url + filename, true);
        xhttp.send(null);
    });
}

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if(success) {
        return shader;
    }
    console.log(source.text + " " + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexSource, fragmentSource) {
    return new Promise(function(resolve, reject) {
        var vertexShaderPromise = loadSource(vertexSource);
        var fragmentShaderPromise = loadSource(fragmentSource);
        Promise.all([vertexShaderPromise, fragmentShaderPromise]).then(function(values) {
            var vertexShaderSource = values[0];
            var fragmentShaderSource = values[1];
            var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
            var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
            var prog = gl.createProgram();
            gl.attachShader(prog, vertexShader);
            gl.attachShader(prog, fragmentShader);
            gl.linkProgram(prog);
            var success = gl.getProgramParameter(prog, gl.LINK_STATUS);
            if(success) {
                var attrSetts = createAttribSetters(gl, prog);
                var unifSetts = createUniformSetters(gl, prog);
                resolve({
                    program: prog,
                    attribSetters: attrSetts,
                    uniformSetters: unifSetts
                });
            }
            else {
                reject(gl.getProgramInfoLog(prog));
                gl.deleteProgram(prog);
            }
        }).catch(function(reason) {
            reject(reason);
        });
    });
}

function makePrograms(gl, programs) {
    return new Promise(function(resolve, reject) {
        var promises = [];
        for(var program in programs) {
            if(programs.hasOwnProperty(program)) {
                promises.push(createProgram(gl, programs[program].vertexSource, programs[program].fragmentSource));
            }
        }
        Promise.all(promises).then(function(values) {
            var i = 0;
            for(var program in programs) {
                if(programs.hasOwnProperty(program)) {
                    for(var prop in values[i]) {
                        if(values[i].hasOwnProperty(prop)) {
                            programs[program][prop] = values[i][prop];
                        }
                    }
                    i++;
                }
            }
            resolve(true);
        }).catch(function(reason) {
            reject(reason);
        });
    });
}

function loadResources(res) {
    return new Promise(function(resolve, reject) {
        var promises = [];
        for(var im in res.images) {
            if(res.images.hasOwnProperty(im)) {
                promises.push(new Promise(function(resolve, reject) {
                    var image = new Image();
                    image.onload = function() {
                        resolve(image);
                    };
                    image.onerror = function() {
                        reject("Error loading image " + im);
                    };
                    image.src = url + "/resources/images/" + im;
                }));
            }
        }
        Promise.all(promises).then(function(values) {
            var i=0;
            for(var im in res.images) {
                if(res.images.hasOwnProperty(im)) {
                    res.images[im] = values[i++];
                }
            }
            resolve(true);
        }).catch(function(reason) {
            reject(reason);
        });
    });
}

function createAttribSetters(gl, program) {
    var attribSetters = {};
    
    function getAttribSetter(loc) {
        return function(attr) {
            gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, attr.numComponents || attr.size, attr.type || gl.FLOAT, attr.normalize || false, attr.stride || 0, attr.offset || 0);
        };
    }
    
    var n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for(var i=0; i<n; i++) {
        var attribInfo = gl.getActiveAttrib(program, i);
        if(!attribInfo) {
            break;
        }
        var loc = gl.getAttribLocation(program, attribInfo.name);
        attribSetters[attribInfo.name] = getAttribSetter(loc);
    }
    return attribSetters;
}

function setAttributes(setters, attribs) {
    for(var attr in attribs) {
        if(attribs.hasOwnProperty(attr)) {
            var set = setters[attr];
            if(set) {
                set(attribs[attr]);
            }
        }
    }
}

function createUniformSetters(gl, program) {
    var uniformSetters = {};
    var textureUnit = 0;
    
    function getUniformSetter(program, uniformInfo, textureUnit) {
        var loc = gl.getUniformLocation(program, uniformInfo.name);
        var type = uniformInfo.type;
        var isArray = (uniformInfo.size > 1 && uniformInfo.name.substr(-3) === '[0]');
        switch(type) {
            case gl.FLOAT:
                if(isArray) {
                    return function(u) {
                        gl.uniform1fv(loc, u);
                    };
                }
                else {
                    return function(u) {
                        gl.uniform1f(loc, u);
                    };
                }
                break;
            case gl.FLOAT_VEC2:
                return function(u) {
                    gl.uniform2fv(loc, u);
                };
                break;
            case gl.FLOAT_VEC3:
                return function(u) {
                    gl.uniform3fv(loc, u);
                };
                break;
            case gl.FLOAT_VEC4:
                return function(u) {
                    gl.uniform4fv(loc, u);
                };
                break;
            case gl.INT:
                if(isArray) {
                    return function(u) {
                        gl.uniform1iv(loc, u);
                    };
                }
                else {
                    return function(u) {
                        gl.uniform1i(loc, u);
                    };
                }
                break;
            case gl.INT_VEC2:
                return function(u) {
                    gl.uniform2iv(loc, u);
                };
                break;
            case gl.INT_VEC3:
                return function(u) {
                    gl.uniform3iv(loc, u);
                };
                break;
            case gl.INT_VEC4:
                return function(u) {
                    gl.uniform4iv(loc, u);
                };
                break;
            case gl.BOOL:
                return function(u) {
                    gl.uniform1iv(loc, u);
                };
                break;
            case gl.BOOL_VEC2:
                return function(u) {
                    gl.uniform2iv(loc, u);
                };
                break;
            case gl.BOOL_VEC3:
                return function(u) {
                    gl.uniform3iv(loc, u);
                };
                break;
            case gl.BOOL_VEC4:
                return function(u) {
                    gl.uniform4iv(loc, u);
                };
                break;
            case gl.FLOAT_MAT2:
                return function(u) {
                    gl.uniformMatrix2fv(loc, false, u);
                };
                break;
            case gl.FLOAT_MAT3:
                return function(u) {
                    gl.uniformMatrix3fv(loc, false, u);
                };
                break;
            case gl.FLOAT_MAT4:
                return function(u) {
                    gl.uniformMatrix4fv(loc, false, u);
                };
                break;
            case gl.SAMPLER_2D: case gl.SAMPLER_CUBE:
                if(isArray) {
                    var units = [];
                    var textureUnit = 0;
                    for(var i=0; i<uniformInfo.size; i++) {
                        units.push(textureUnit++);
                    }
                    return function(bindPoint, units) {
                        return function(textures) {
                            gl.uniform1iv(loc, units);
                            textures.forEach(function(texture, index) {
                                gl.activeTexture(gl.TEXTURE0+units[index]);
                                gl.bindTexture(bindPoint, texture);
                            });
                        };
                    }(type === gl.SAMPLER_2D ? gl.TEXTURE_2D : type === gl.SAMPLER_CUBE ? gl.TEXTURE_CUBE_MAP : undefined, units);
                }
                else {
                    return function(bindPoint, unit) {
                        return function(texture) {
                            gl.activeTexture(gl.TEXTURE0+unit);
                            gl.bindTexture(bindPoint, texture);
                            gl.uniform1i(loc, unit);
                        };
                    }(type === gl.SAMPLER_2D ? gl.TEXTURE_2D : type === gl.SAMPLER_CUBE ? gl.TEXTURE_CUBE_MAP : undefined, textureUnit);
                }
                break;
            default:
                return null;
        };
    }
    
    var n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for(var i=0; i<n; i++) {
        var uniformInfo = gl.getActiveUniform(program, i);
        if(!uniformInfo) {
            break;
        }
        var name = uniformInfo.name;
        if(name.substr(-3) === '[0]') {
            name = name.substr(0, name.length - 3);
        }
        uniformSetters[name] = getUniformSetter(program, uniformInfo, textureUnit);
        if(uniformInfo.type == gl.SAMPLER_2D || uniformInfo.type == gl.SAMPLER_CUBE) {
            if(uniformInfo.size > 1 && uniformInfo.name.substr(-3) === '[0]') {
                textureUnit += uniformInfo.size;
            }
            else {
                textureUnit ++;
            }
        }
    }
    return uniformSetters;
}

function setUniforms(setters, uniforms) {
    for(var unif in uniforms) {
        if(uniforms.hasOwnProperty(unif)) {
            var set = setters[unif];
            if(set) {
                set(uniforms[unif]);
            }
        }
    }
}