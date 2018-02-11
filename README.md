# WebGL Engine
A 3D graphics engine built using WebGL and Javascript. See below for features.

## Demo
[Check out the live demo scene](https://ddakev.github.io/webgl-engine/)

##### Controls:
- to enable mouse and keyboard controls, click anywhere inside the browser (this will disable the mouse cursor; to bring it back press `Esc`)
- while in 'fly' mode (default), use `W`, `A`, `S`, `D` to move forward, left, backward, and right; `Shift` to move up, `Ctrl` to move down
- press `G` to toggle gravity on or off (and switch between the control schemes for 'fly' and 'walk')
- while in 'walk' mode (with gravity turned on), use `W`, `A`, `S`, `D` to move forward, left, backward, and right and `Space` to jump
- to pause the demo and regain control of mouse cursor, press `Esc`

##### System requirements:
- minimum 1 GB of GPU memory
- if available, it's recommended to make your browser use a discrete graphics card for rendering


# Running on local
To run the current scene set-up, you need to have node.js installed. If you don't, you have to [download and install node.js first](https://nodejs.org/en/download/).

From the command line, navigate to the project root path and run:

`$> node server`

Then, open a browser and navigate to [http://localhost:8080/](http://localhost:8080/)

# Features
This project is very much still in its early stages of development. The following lists will be updated continuously.
##### Currently implemented features:
- OOP class design making it easy to add objects to a scene, move, rotate, scale and draw objects
- Primitive 3D meshes (cubes, spheres)
- OBJ format mesh importer
- Phong shaders
- Directional, Point and Spot Lights
- Orthographic and Perspective Cameras
- Materials
- Scene graph
- Terrain generator using heightmap, and terrain renderers
- Water shaders
- Skybox
- Cascading Shadow Maps with Poisson sampling
- Frustum Culling

##### Near-future features (in no particular order):
- Physically based rendering (PBR)
- Particle and Rigidbody Physics system
- Spatial audio using WebAudio API
- Improved terrain rendering with level-of-detail and culling (either quad-trees or geometry clipmaps, or a combination of both)
- Billboard objects (and in particular foliage)

... and more

##### Far-future features:
- Level editor (with GUI and everything)
- Runtime modular shader generator