var paused = 0;
var gravityMode = false;
var gheld = false;
var gravity = new vec3(0, 0, -50);

var canvas;
var gl;
var gameLoopRequest;
var ext;
var WIDTH;
var HEIGHT;
var url = window.location.href.split('?')[0];
var keysPressed = {};
var lastUpdate = 0;
var dt = 0;
var jitters = null;
var jitterSize = 8;

if (typeof KeyEvent == "undefined") {
    var KeyEvent = {
        DOM_VK_CANCEL: 3,
        DOM_VK_HELP: 6,
        DOM_VK_BACK_SPACE: 8,
        DOM_VK_TAB: 9,
        DOM_VK_CLEAR: 12,
        DOM_VK_RETURN: 13,
        DOM_VK_ENTER: 14,
        DOM_VK_SHIFT: 16,
        DOM_VK_CONTROL: 17,
        DOM_VK_ALT: 18,
        DOM_VK_PAUSE: 19,
        DOM_VK_CAPS_LOCK: 20,
        DOM_VK_ESCAPE: 27,
        DOM_VK_SPACE: 32,
        DOM_VK_PAGE_UP: 33,
        DOM_VK_PAGE_DOWN: 34,
        DOM_VK_END: 35,
        DOM_VK_HOME: 36,
        DOM_VK_LEFT: 37,
        DOM_VK_UP: 38,
        DOM_VK_RIGHT: 39,
        DOM_VK_DOWN: 40,
        DOM_VK_PRINTSCREEN: 44,
        DOM_VK_INSERT: 45,
        DOM_VK_DELETE: 46,
        DOM_VK_0: 48,
        DOM_VK_1: 49,
        DOM_VK_2: 50,
        DOM_VK_3: 51,
        DOM_VK_4: 52,
        DOM_VK_5: 53,
        DOM_VK_6: 54,
        DOM_VK_7: 55,
        DOM_VK_8: 56,
        DOM_VK_9: 57,
        DOM_VK_SEMICOLON: 59,
        DOM_VK_EQUALS: 61,
        DOM_VK_A: 65,
        DOM_VK_B: 66,
        DOM_VK_C: 67,
        DOM_VK_D: 68,
        DOM_VK_E: 69,
        DOM_VK_F: 70,
        DOM_VK_G: 71,
        DOM_VK_H: 72,
        DOM_VK_I: 73,
        DOM_VK_J: 74,
        DOM_VK_K: 75,
        DOM_VK_L: 76,
        DOM_VK_M: 77,
        DOM_VK_N: 78,
        DOM_VK_O: 79,
        DOM_VK_P: 80,
        DOM_VK_Q: 81,
        DOM_VK_R: 82,
        DOM_VK_S: 83,
        DOM_VK_T: 84,
        DOM_VK_U: 85,
        DOM_VK_V: 86,
        DOM_VK_W: 87,
        DOM_VK_X: 88,
        DOM_VK_Y: 89,
        DOM_VK_Z: 90,
        DOM_VK_CONTEXT_MENU: 93,
        DOM_VK_NUMPAD0: 96,
        DOM_VK_NUMPAD1: 97,
        DOM_VK_NUMPAD2: 98,
        DOM_VK_NUMPAD3: 99,
        DOM_VK_NUMPAD4: 100,
        DOM_VK_NUMPAD5: 101,
        DOM_VK_NUMPAD6: 102,
        DOM_VK_NUMPAD7: 103,
        DOM_VK_NUMPAD8: 104,
        DOM_VK_NUMPAD9: 105,
        DOM_VK_MULTIPLY: 106,
        DOM_VK_ADD: 107,
        DOM_VK_SEPARATOR: 108,
        DOM_VK_SUBTRACT: 109,
        DOM_VK_DECIMAL: 110,
        DOM_VK_DIVIDE: 111,
        DOM_VK_F1: 112,
        DOM_VK_F2: 113,
        DOM_VK_F3: 114,
        DOM_VK_F4: 115,
        DOM_VK_F5: 116,
        DOM_VK_F6: 117,
        DOM_VK_F7: 118,
        DOM_VK_F8: 119,
        DOM_VK_F9: 120,
        DOM_VK_F10: 121,
        DOM_VK_F11: 122,
        DOM_VK_F12: 123,
        DOM_VK_F13: 124,
        DOM_VK_F14: 125,
        DOM_VK_F15: 126,
        DOM_VK_F16: 127,
        DOM_VK_F17: 128,
        DOM_VK_F18: 129,
        DOM_VK_F19: 130,
        DOM_VK_F20: 131,
        DOM_VK_F21: 132,
        DOM_VK_F22: 133,
        DOM_VK_F23: 134,
        DOM_VK_F24: 135,
        DOM_VK_NUM_LOCK: 144,
        DOM_VK_SCROLL_LOCK: 145,
        DOM_VK_COMMA: 188,
        DOM_VK_PERIOD: 190,
        DOM_VK_SLASH: 191,
        DOM_VK_BACK_QUOTE: 192,
        DOM_VK_OPEN_BRACKET: 219,
        DOM_VK_BACK_SLASH: 220,
        DOM_VK_CLOSE_BRACKET: 221,
        DOM_VK_QUOTE: 222,
        DOM_VK_META: 224
    };
}

const resources = {
    images: {
        "earth.jpg": null,
        "skybox.png": null,
        "terrainHeight.png": null,
        "terrainMoisture.png": null,
        "terrainColor.png": null,
        "sandDiffuse.png": null,
        "sandNormal.png": null,
        "grassDiffuse.png": null,
        "grassNormal.png": null,
        "forestDiffuse.png": null,
        "forestNormal.png": null,
        "snowDiffuse.png": null,
        "snowNormal.png": null,
        "dudv.png": null,
        "waterNormal.png": null
    },
    models: {
        "rock.obj": null,
        "pine.obj": null,
        "tree.obj": null,
        "snowy_pine.obj": null
    }
};
var programs = {
    texturedPhong: {
        vertexSource: "/shaders/texturedPhong/vertex.glsl",
        fragmentSource: "/shaders/texturedPhong/fragment.glsl"
    },
    skybox: {
        vertexSource: "/shaders/skybox/vertex.glsl",
        fragmentSource: "/shaders/skybox/fragment.glsl"
    },
    terrain: {
        vertexSource: "/shaders/terrain/vertex.glsl",
        fragmentSource: "/shaders/terrain/fragment.glsl"
    },
    water: {
        vertexSource: "/shaders/water/vertex.glsl",
        fragmentSource: "/shaders/water/fragment.glsl"
    },
    shadow: {
        vertexSource: "/shaders/shadow/vertex.glsl",
        fragmentSource: "/shaders/shadow/fragment.glsl"
    }
};
var camera;
var lightDir;
var lightLoc;
var skybox;
var clipPlane;
var waterLevel = 8;

var gameObjects = [];
var dirLights = [];
var pointLights = [];
var spotLights = [];
var root;
var plane;
var objects = [];
var lightCube;
var terrain;
var water;

var pos = -5;
var goup = true;
var cameraSpeed = 10;
var cameravVelocity = 0;
var cameravAcc = 0;

var cameraLook = function(e) {
    let dx = e.movementX;
    let dy = e.movementY;
    camera.pitch(-360 * dy / 1000).yaw(360 * dx / 1000);
    //dirLights[0].setDirection(new vec3(camera.getDirection().x, camera.getDirection().y, camera.getDirection().z));
    //dirLights[0].camera.setDirection(dirLights[0].getDirection());
};

var keyPressed = e => keysPressed[e.keyCode] = true;

var keyReleased = e => keysPressed[e.keyCode] = false;

window.addEventListener("load", function(e) {
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;
    canvas = document.getElementById("webgl");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    
    canvas.addEventListener("webglcontextlost", function(e) {
        e.preventDefault();
    });
    canvas.addEventListener("webglcontextrestored", function(e) {
        console.log("webgl context restored");
        cancelAnimationFrame(gameLoopRequest);
        init(true);
    });
    
    Promise.all([
        loadResources(resources),
        loadShaders(programs)
    ]).then(function(values) {
        init();
    }).catch(function(reason) {
        console.log(reason);
    });
    
    canvas.addEventListener("click", function(e) {
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
        canvas.requestPointerLock();
    });
    
    window.addEventListener("resize", function(e) {
        WIDTH = window.innerWidth;
        HEIGHT = window.innerHeight;
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
    });
});

function init(contextLost) {
    gl = canvas.getContext('webgl');
    ext = gl.getExtension('WEBGL_depth_texture');
    makePrograms(gl, programs);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    generateJitters(gl);
    
    if(contextLost) {
        // diagnose and fix context loss problem (might need to create textures and arraybuffers all over again)
    }
    else {
        prepScene();
    }
    drawScene();
}

function prepScene() {
    lightDir = [0.5, -1, 0.7];
    lightLoc = [1, 1, 1];
    
    skybox = new Skybox(gl, programs.skybox, resources.images["skybox.png"]);
    
    terrain = new Terrain(gl,
                          programs.terrain,
                          resources.images["terrainHeight.png"],
                          resources.images["terrainMoisture.png"],
                          resources.images["terrainColor.png"],
                          {
                            sandDiffuse:    resources.images["sandDiffuse.png"],
                            sandNormal:     resources.images["sandNormal.png"],
                            grassDiffuse:    resources.images["grassDiffuse.png"],
                            grassNormal:     resources.images["grassNormal.png"],
                            forestDiffuse:    resources.images["forestDiffuse.png"],
                            forestNormal:     resources.images["forestNormal.png"],
                            snowDiffuse:    resources.images["snowDiffuse.png"],
                            snowNormal:     resources.images["snowNormal.png"]
                          },
                         { maxHeight: 20 });
    terrain.move(new vec3(-50, 0, -20));
    gameObjects.push(terrain);
    
    water = new Water(gl, programs.water, (terrain.mesh.cols-1) * terrain.mesh.squareSize, (terrain.mesh.rows-1) * terrain.mesh.squareSize, {
        dudv: resources.images["dudv.png"],
        normal: resources.images["waterNormal.png"]
    });
    water.move(new vec3(terrain.getPosition().x, terrain.getPosition().y, terrain.getPosition().z + waterLevel));
    
    root = new GameObject();
    plane = new GameObject(programs.texturedPhong, new Cube(gl, 1, new Material(gl, {diffuse: [204, 219, 220, 255]})));
    objects = [
        new GameObject(programs.texturedPhong, new Sphere(gl, 32, new Material(gl, {diffuse: [26, 255, 102, 255]}))),
        new GameObject(programs.texturedPhong, new Mesh(gl, resources.models["pine.obj"], new Material(gl, {diffuse: [79, 124, 65, 255, 62, 37, 26, 255]}))),
        new GameObject(programs.texturedPhong, new Mesh(gl, resources.models["rock.obj"], new Material(gl, {diffuse: [170, 170, 160, 255]}))),
        new GameObject(programs.texturedPhong, new Mesh(gl, resources.models["tree.obj"], new Material(gl, {diffuse: [39, 84, 25, 255, 62, 37, 26, 255]}))),
        new GameObject(programs.texturedPhong, new Cube(gl, 1, new Material(gl, {diffuse: [136, 77, 255, 255]})))
    ];
    lightCube = new GameObject(programs.texturedPhong, new Cube(gl, 0.1, new Material(gl, {diffuse: [26, 255, 102, 255]})));
    
    /*center = new GameObject();
    centerCube = new GameObject(programs.texturedPhong, new Sphere(gl, 32, new Material(gl, {diffuse: resources.images["earth.jpg"], shininess: 16})));
    cubeOrbit = new GameObject();
    orbitCube = new GameObject(programs.texturedPhong, new Cube(gl));*/
    
    camera = new PerspectiveCamera({
        fov:    45,
        aRatio: gl.canvas.clientWidth / gl.canvas.clientHeight,
        near:   0.1,
        far:    2000
    });
    var light = new PointLight([0,0,0], {
        ambientIntensity:   0.15,
        range:              200,
        intensity:          2,
        specularIntensity:  0.4
    });
    
    /*var light2 = new SpotLight([0, 0, 0], [0, 0, -1], {
        ambientIntensity:   0.3,
        linear:             0.01,
        quadratic:          0.015,
        intensity:          2,
        specularIntensity:  0.4,
        innerCutoff:        0,
    });*/
    
    light.setParent(root);
    //light2.setParent(root);
    lightCube.setParent(root);
    plane.setParent(root);
    //objects.forEach(obj => obj.setParent(root));
    
    /*center.setParent(root);
    centerCube.setParent(center);
    cubeOrbit.setParent(center);
    orbitCube.setParent(cubeOrbit);*/
    
    /*center.applyTransformations(new mat4().translate(0,0,-3));
    cubeOrbit.applyTransformations(new mat4().translate(2,0,0).zRotate(30));*/
    plane.applyScale(new vec3(10, 10, 0.1)).move(new vec3(0, 10, -5));
    objects[0].move(new vec3(2, 13, -4));
    objects[1].move(new vec3(3, 8, -1));
    objects[2].move(new vec3(0, 10, -3));
    objects[3].move(new vec3(3, 13, -3.5));
    objects[4].move(new vec3(-2, 7, -2));
    lightCube.move(new vec3(lightLoc));
    for(let i=0; i<125; i++) {
        let x = Math.random() * terrain.mesh.cols * terrain.mesh.squareSize;
        let y = Math.random() * terrain.mesh.rows * terrain.mesh.squareSize;
        let height = (terrain.getHeight(terrain.getAbsolutePosition().x + x, terrain.getAbsolutePosition().y + y)-terrain.getAbsolutePosition().z) / terrain.mesh.maxHeight;
        if(height < (waterLevel-1) / terrain.mesh.maxHeight) {}
        else if(height < 0.45) {
            // rock
            let rock = new GameObject(programs.texturedPhong, new Mesh(gl, resources.models["rock.obj"], new Material(gl, {diffuse: [170, 170, 160, 255]})));
            rock.setParent(terrain);
            rock.rotate(vec3.UP, Math.random() * 360);
            rock.setScale(new vec3(Math.random() * 0.4 + 0.4,Math.random() * 0.4 + 0.4,Math.random() * 0.4 + 0.4));
            rock.setPosition(new vec3(x, y, height * terrain.mesh.maxHeight));
            gameObjects.push(rock);
        }
        else if(height < 0.65) {
            // tree
            let tree = new GameObject(programs.texturedPhong, new Mesh(gl, resources.models["tree.obj"], new Material(gl, {diffuse: [39, 84, 25, 255, 62, 37, 26, 255]})));
            tree.setParent(terrain);
            tree.rotate(vec3.UP, Math.random() * 360);
            tree.setScale(new vec3(Math.random() * 0.4 + 0.4));
            tree.setPosition(new vec3(x, y, height * terrain.mesh.maxHeight));
            gameObjects.push(tree);
        }
        else if(height < 0.85) {
            // pine
            let pine = new GameObject(programs.texturedPhong, new Mesh(gl, resources.models["pine.obj"], new Material(gl, {diffuse: [79, 124, 65, 255, 62, 37, 26, 255]})));
            pine.setParent(terrain);
            pine.rotate(vec3.UP, Math.random() * 360);
            pine.setScale(new vec3(Math.random() * 0.4 + 0.4));
            pine.setPosition(new vec3(x, y, height * terrain.mesh.maxHeight));
            gameObjects.push(pine);
        }
        else {
            // snowy pine
            let pine = new GameObject(programs.texturedPhong, new Mesh(gl, resources.models["snowy_pine.obj"], new Material(gl, {diffuse: [79, 124, 65, 255, 62, 37, 26, 255, 215, 222, 207, 255, 215, 222, 207, 255]})));
            pine.setParent(terrain);
            pine.rotate(vec3.UP, Math.random() * 360);
            pine.setScale(new vec3(Math.random() * 0.4 + 0.4));
            pine.setPosition(new vec3(x, y, height * terrain.mesh.maxHeight));
            gameObjects.push(pine);
        }
    }
    
    gameObjects.push(lightCube);
    gameObjects.push(plane);
    objects.forEach(obj => gameObjects.push(obj));
    /*gameObjects.push(centerCube);
    gameObjects.push(orbitCube);*/
    
    //root.move(new vec3(0, 4, 0));
    camera.move(new vec3(25, 2, 0));
    camera.lookAt(plane);
    
    light.move(new vec3(2, 4, 2));
    //pointLights.push(light);
    
    
    let dl = new DirectionalLight([1, 1, -1], {intensity: 2.7});
    let lightCamera = new OrthographicCamera({
        left:  -10,
        right: 10,
        top:   10,
        bottom: -10,
        near:  0,
        far:   400
    });
    //lightCamera.setPosition(plane.getPosition());
    lightCamera.setDirection(dl.getDirection());
    //lightCamera.moveBackward(200);
    dl.setCamera(lightCamera);
    dirLights.push(dl);
    
    document.addEventListener("pointerlockchange", function(e) {
        if(document.pointerLockElement == canvas || document.mozPointerLockElement == canvas) {
            console.log("Pointer lock active");
            paused = false;
            document.addEventListener("mousemove", cameraLook);
            document.addEventListener("keydown", keyPressed);
            document.addEventListener("keyup", keyReleased);
        }
        else {
            console.log("Pointer lock removed");
            paused = true;
            document.removeEventListener("mousemove", cameraLook);
            document.removeEventListener("keydown", keyPressed);
            document.removeEventListener("keyup", keyReleased);
        }
    });
}

function drawScene(time) {
    if(paused) {
        window.requestAnimationFrame(drawScene);
        return;
    }
    
    dt = (time - lastUpdate) / 1000;
    if(isNaN(dt)) dt = 0;
    lastUpdate = time;
    
    camera.updatePlanes();
    
    gl.cullFace(gl.FRONT);
    renderShadowMaps(camera, 1024, 1024);
    gl.cullFace(gl.BACK);
    
    let sign = (camera.getPosition().z - water.getPosition().z) / Math.abs(camera.getPosition().z - water.getPosition().z);
    clipPlane = new vec4(0, 0, -1 * sign, -1 * sign * water.getPosition().z-0.1);
    let { color: refraction, depth: refractionDepth } = renderToTexture(1280, 780, {color: null, depth: null});
    clipPlane = new vec4(0, 0, 1, water.getPosition().z);
    camera.setPosition(new vec3(camera.getPosition().x, camera.getPosition().y, 2*water.getPosition().z - camera.getPosition().z));
    camera.setDirection(new vec3(camera.getDirection().x, camera.getDirection().y, -camera.getDirection().z));
    camera.updatePlanes();
    let { color: reflection } = renderToTexture(640, 480, {color: null});
    camera.setPosition(new vec3(camera.getPosition().x, camera.getPosition().y, 2*water.getPosition().z - camera.getPosition().z));
    camera.setDirection(new vec3(camera.getDirection().x, camera.getDirection().y, -camera.getDirection().z));
    camera.updatePlanes();
    clipPlane = new vec4(0, 0, 1, -10000);
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.disable(gl.DEPTH_TEST);
    skybox.draw(gl, camera);
    gl.enable(gl.DEPTH_TEST);
    
    for(let i=0; i<gameObjects.length; i++) {
        gameObjects[i].draw(gl, camera);
    }
    gl.disable(gl.CULL_FACE);
    water.draw(gl, camera, reflection, refraction, refractionDepth);
    gl.enable(gl.CULL_FACE);
    
    if(pos > -1) goup = false;
    if(pos < -5) goup = true;
    if(goup) {
        plane.move(new vec3(0, 0, 0.01));
        pos += 0.01;
    }
    else {
        plane.move(new vec3(0, 0, -0.01));
        pos -= 0.01;
    }
    if(gravityMode) {
        if(keysPressed[KeyEvent.DOM_VK_W]) {
            camera.move(new vec3(camera.getDirection().x, camera.getDirection().y, 0), cameraSpeed * dt);
        }
        if(keysPressed[KeyEvent.DOM_VK_S]) {
            camera.move(new vec3(-camera.getDirection().x, -camera.getDirection().y, 0), cameraSpeed * dt);
        }
        if(keysPressed[KeyEvent.DOM_VK_A]) {
            camera.move(new vec3(-camera.getDirection().y, camera.getDirection().x, 0), cameraSpeed * dt);
        }
        if(keysPressed[KeyEvent.DOM_VK_D]) {
            camera.move(new vec3(camera.getDirection().y, -camera.getDirection().x, 0), cameraSpeed * dt);
        }
        cameravVelocity += (gravity.z + cameravAcc) * dt;
        camera.moveUp(cameravVelocity * dt);
        let cPos = camera.getPosition();
        let heightAtCamera = terrain.getHeight(cPos.x, cPos.y);
        if(cPos.z < heightAtCamera + 2) {
            camera.setPosition(new vec3(cPos.x, cPos.y, heightAtCamera + 2));
            cameravVelocity = 0;
        }
        if(keysPressed[KeyEvent.DOM_VK_SPACE] && cPos.z - heightAtCamera < 3) {
            cameravAcc = 200;
            setTimeout(function() {cameravAcc = 0;}, 75);
        }
    }
    else {
        if(keysPressed[KeyEvent.DOM_VK_W]) {
            camera.moveForward(cameraSpeed * dt);
        }
        if(keysPressed[KeyEvent.DOM_VK_S]) {
            camera.moveBackward(cameraSpeed * dt);
        }
        if(keysPressed[KeyEvent.DOM_VK_A]) {
            camera.moveLeft(cameraSpeed * dt);
        }
        if(keysPressed[KeyEvent.DOM_VK_D]) {
            camera.moveRight(cameraSpeed * dt);
        }
        if(keysPressed[KeyEvent.DOM_VK_SHIFT]) {
            camera.moveUp(cameraSpeed * dt);
        }
        if(keysPressed[KeyEvent.DOM_VK_CONTROL]) {
            camera.moveDown(cameraSpeed * dt);
        }
    }
    if(keysPressed[KeyEvent.DOM_VK_G]) {
        if(!gheld) {
            gravityMode ^= 1;
        }
        gheld = true;
    }
    else {
        gheld = false;
    }
    if(keysPressed[KeyEvent.DOM_VK_P]) {
        paused = true;
    }
    
    water.setPosition(new vec3(terrain.getPosition().x, terrain.getPosition().y, terrain.getPosition().z + waterLevel));
    water.moveWaves(dt);
    
    /*cubeOrbit.applyTransformations(new mat4().rotate([-1, 2, 0], 0.5));
    orbitCube.applyTransformations(new mat4().xRotate(0.3).yRotate(0.3).zRotate(0.3));
    centerCube.applyTransformations(new mat4().yRotate(-0.2));*/
    for(let i=0; i<dirLights.length; i++) {
        gl.deleteTexture(dirLights[i].shadowMap);
    }
    gl.deleteTexture(reflection);
    gl.deleteTexture(refraction);
    gl.deleteTexture(refractionDepth);
    gameLoopRequest = window.requestAnimationFrame(drawScene);
}

function renderToTexture(width, height, query) {
    let color, depth;
    
    if(query.hasOwnProperty("color")) {
        color = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, color);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    
    if(query.hasOwnProperty("depth")) {
        depth = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, depth);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, width, height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
        
    let fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    if(query.hasOwnProperty("color")) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);
    }
    if(query.hasOwnProperty("depth")) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth, 0);
    }
    
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.disable(gl.DEPTH_TEST);
    skybox.draw(gl, camera);
    gl.enable(gl.DEPTH_TEST);
    
    for(let i=0; i<gameObjects.length; i++) {
        gameObjects[i].draw(gl, camera);
    }
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb);
    
    return { color, depth };
}

function renderShadowMaps(camera, width, height) {
    for(let i=0; i<dirLights.length; i++) {        
        let sMap = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, sMap);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, width, height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        let fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, sMap, 0);
        
        gl.viewport(0, 0, width, height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        //dirLights[i].camera.bindCamera(terrainIntersection);
        dirLights[i].camera.updatePlanes();
        
        for(let j=0; j<gameObjects.length; j++) {
            gameObjects[j].drawShadow(gl, programs.shadow, dirLights[i].camera);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.deleteFramebuffer(fb);
        dirLights[i].shadowMap = sMap;
    }
}

function generateJitters(gl) {
    let data = [];
    for(let i = 0; i < jitterSize * jitterSize; i++) {
        data.push(Math.random() * 256, Math.random() * 256, 0, 0);
    }
    data = new Uint8Array(data);
    jitters = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, jitters);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, jitterSize, jitterSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.generateMipmap(gl.TEXTURE_2D);
}

function loadSource(filename) {
    return new Promise(function(resolve, reject) {
        let xhttp = new XMLHttpRequest();
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

function loadImage(filename) {
    return new Promise(function(resolve, reject) {
        let image = new Image();
        image.onload = function() {
            let tCanvas = document.createElement("canvas");
            let tCtx = tCanvas.getContext('2d');
            tCanvas.width = image.width;
            tCanvas.height = image.height;
            tCtx.drawImage(image, 0, 0);
            resolve(tCtx.getImageData(0, 0, image.width, image.height));
        };
        image.onerror = function() {
            reject("Error loading image " + filename);
        };
        image.src = url + "/images/" + filename;
    });
}

function loadModel(filename) {
    return new Promise(function(resolve, reject) {
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if(xhttp.readyState == 4) {
                if(xhttp.status == 200) {
                    resolve({format: filename.slice(-3), data: xhttp.responseText});
                }
                else {
                    reject("Error getting resource " + filename);
                }
            }
        }
        xhttp.open("GET", url + "/models/" + filename, true);
        xhttp.send(null);
    });
}

function createShader(gl, type, source) {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if(success) {
        return shader;
    }
    console.log(source.text + " " + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    let prog = gl.createProgram();
    gl.attachShader(prog, vertexShader);
    gl.attachShader(prog, fragmentShader);
    gl.linkProgram(prog);
    let success = gl.getProgramParameter(prog, gl.LINK_STATUS);
    if(success) {
        let attrSetts = createAttribSetters(gl, prog);
        let unifSetts = createUniformSetters(gl, prog);
        return {
            program: prog,
            attribSetters: attrSetts,
            uniformSetters: unifSetts
        };
    }
    else {
        console.log(gl.getProgramInfoLog(prog));
        gl.deleteProgram(prog);
        return null;
    }
}

function makePrograms(gl, programs) {
    for(let program in programs) {
        if(programs.hasOwnProperty(program)) {
            let programInfo = createProgram(gl, programs[program].vertexShader, programs[program].fragmentShader);
            for(let prop in programInfo) {
                if(programInfo.hasOwnProperty(prop)) {
                    programs[program][prop] = programInfo[prop];
                }
            }
        }
    }
}

function loadShaders(programs) {
    return new Promise(function(resolve, reject) {
        let promises = [];
        for(let program in programs) {
            if(programs.hasOwnProperty(program)) {
                promises.push(new Promise(function(resolve, reject) {
                    let minipromises = [];
                    minipromises.push(loadSource(programs[program].vertexSource), loadSource(programs[program].fragmentSource));
                    Promise.all(minipromises).then(function(values) {
                        programs[program].vertexShader = values[0];
                        programs[program].fragmentShader = values[1];
                        resolve();
                    }).catch(function(reason) {
                        reject(reason);
                    });
                }));
            }
        }
        Promise.all(promises).then(function(values) {
            resolve();
        }).catch(function(reason) {
            reject(reason);
        });
    });
}

function loadResources(res) {
    return new Promise(function(resolve, reject) {
        let promises = [];
        for(let im in res.images) {
            if(res.images.hasOwnProperty(im)) {
                promises.push(loadImage(im));
            }
        }
        for(let m in res.models) {
            if(res.models.hasOwnProperty(m)) {
                promises.push(loadModel(m));
            }
        }
        Promise.all(promises).then(function(values) {
            let i=0;
            for(let im in res.images) {
                if(res.images.hasOwnProperty(im)) {
                    res.images[im] = values[i++];
                }
            }
            for(let m in res.models) {
                if(res.models.hasOwnProperty(m)) {
                    res.models[m] = values[i++];
                }
            }
            resolve(true);
        }).catch(function(reason) {
            reject(reason);
        });
    });
}

function createAttribSetters(gl, program) {
    let attribSetters = {};
    
    function getAttribSetter(loc) {
        return function(attr) {
            gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, attr.numComponents || attr.size, attr.type || gl.FLOAT, attr.normalize || false, attr.stride || 0, attr.offset || 0);
        };
    }
    
    let n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for(let i=0; i<n; i++) {
        let attribInfo = gl.getActiveAttrib(program, i);
        if(!attribInfo) {
            break;
        }
        let loc = gl.getAttribLocation(program, attribInfo.name);
        attribSetters[attribInfo.name] = getAttribSetter(loc);
    }
    return attribSetters;
}

function setAttributes(setters, attribs) {
    for(let attr in attribs) {
        if(attribs.hasOwnProperty(attr)) {
            let set = setters[attr];
            if(set) {
                set(attribs[attr]);
            }
        }
    }
}

function createUniformSetters(gl, program) {
    let uniformSetters = {};
    let textureUnit = 0;
    
    function getUniformSetter(program, uniformInfo, textureUnit) {
        let loc = gl.getUniformLocation(program, uniformInfo.name);
        let type = uniformInfo.type;
        let isArray = (uniformInfo.size > 1 && uniformInfo.name.substr(-3) === '[0]');
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
                    let units = [];
                    let textureUnit = 0;
                    for(let i=0; i<uniformInfo.size; i++) {
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
    
    let n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for(let i=0; i<n; i++) {
        let uniformInfo = gl.getActiveUniform(program, i);
        if(!uniformInfo) {
            break;
        }
        let name = uniformInfo.name;
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
    for(let unif in uniforms) {
        if(uniforms.hasOwnProperty(unif)) {
            let set = setters[unif];
            if(set) {
                set(uniforms[unif]);
            }
        }
    }
}