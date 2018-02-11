function Camera(projectionMatrix, position, target) {
    GameObject.call(this);
    if(position && position instanceof GameObject) {
        this.position = position.getAbsolutePosition();
    }
    else if(position) {
        this.position = new vec3(position);
    }
    if(target && target instanceof GameObject) {
        this.direction = target.getAbsolutePosition().subtract(this.getAbsolutePosition()).normalize();
    }
    else if(target) {
        this.direction = new vec3(target).normalize();
    }
    this.projection = projectionMatrix;
    
    this.planes = {
        near:   null,
        far:    null,
        left:   null,
        right:  null,
        top:    null,
        bottom: null
    };
    this.updatePlanes();
}
Camera.prototype = Object.create(GameObject.prototype);
Camera.prototype.constructor = Camera;

Camera.prototype.getViewProjectionMatrix = function() {
    return this.getWorldMatrix().inverse().multiply(this.projection);
};

Camera.prototype.getViewMatrix = function() {
    return this.getWorldMatrix().inverse();
};

Camera.prototype.getMatrixWoTranslation = function() {
    return new mat4()
                .multiply(mat4.lookAt(new vec3(), new vec3(this.getDirection().x, this.getDirection().z, -this.getDirection().y), new vec3(0, 1, 0)).inverse())
                .multiply(this.projection);
};

Camera.prototype.updatePlanes = function() {
    let vp = this.getViewProjectionMatrix().transpose().mat;
    this.planes.left = new vec4(vp[0]+vp[12], vp[1]+vp[13], vp[2]+vp[14], vp[3]+vp[15]);
    this.planes.right = new vec4(-vp[0]+vp[12], -vp[1]+vp[13], -vp[2]+vp[14], -vp[3]+vp[15]);
    this.planes.bottom = new vec4(vp[4]+vp[12], vp[5]+vp[13], vp[6]+vp[14], vp[7]+vp[15]);
    this.planes.top = new vec4(-vp[4]+vp[12], -vp[5]+vp[13], -vp[6]+vp[14], -vp[7]+vp[15]);
    this.planes.near = new vec4(vp[8]+vp[12], vp[9]+vp[13], vp[10]+vp[14], vp[11]+vp[15]);
    this.planes.far = new vec4(-vp[8]+vp[12], -vp[9]+vp[13], -vp[10]+vp[14], -vp[11]+vp[15]);
};



function PerspectiveCamera(args, position, target) {
    this.fov = args ? args.fov || args.fieldOfView || 60 : 60;
    this.aspect = args ? args.aspect || args.aspectRatio || args.aRatio || 640/480 : 640/480;
    this.near = args ? args.near || 1 : 1;
    this.far = args ? args.far || 2000 : 2000;
    
    this.cascadeSpheres = [];
    let nc = args ? args.cascades || 3 : 3;
    for(let i=0; i<nc; i++) {
        let l = 0.96;
        let near = this.near;
        let far = this.far;
        let zi0 = l * near * Math.pow(far / near, i / nc) + (1 - l) * (near + (i / nc) * (far - near));
        let zi1 = l * near * Math.pow(far / near, (i+1) / nc) + (1 - l) * (near + ((i+1) / nc) * (far - near));
        let p0 = new vec3(Math.tan((this.fov/2) * Math.PI/180) * zi0 * this.aspect, Math.tan((this.fov/2) * Math.PI / 180) * zi0, -zi0);
        let p1 = new vec3(Math.tan((this.fov/2) * Math.PI/180) * zi1 * this.aspect, Math.tan((this.fov/2) * Math.PI / 180) * zi1, -zi1);
        let x = 0;
        let y = 0;
        let z = Math.min(((x-p1.x)*(x-p1.x)+(y-p1.y)*(y-p1.y)-(x-p0.x)*(x-p0.x)-(y-p0.y)*(y-p0.y)-p0.z*p0.z-p1.z*p1.z)/(2*p1.z-2*p0.z), -zi1);
        let r = Math.sqrt((x-p0.x)*(x-p0.x)+(y-p0.y)*(y-p0.y)+(z-p0.z)*(z-p0.z));
        this.cascadeSpheres.push({center: new vec3(x, y, z), radius: r});
    }
    Camera.call(this, mat4.perspective(this.fov, this.aspect, this.near, this.far), position, target);
}
PerspectiveCamera.prototype = Object.create(Camera.prototype);
PerspectiveCamera.prototype.constructor = PerspectiveCamera;

PerspectiveCamera.prototype.getCascadeBoundingSphere = function(cascade) {
    let cameraMat = this.getWorldMatrix();
    let worldSpaceCenter = new vec3(cameraMat.multiply(new vec4(this.cascadeSpheres[cascade].center, 1)).xyz);
    return {center: worldSpaceCenter, radius: this.cascadeSpheres[cascade].radius};;
}



function OrthographicCamera(args, position, target) {
    this.left = args.left || 0;
    this.top = args.top || 0;
    this.right = args.right || (args.width ? args.width+left : 640+left);
    this.bottom = args.bottom || (args.height ? args.height+top : 480+top);
    this.near = args.near || -400;
    this.far = args.far || 400;
    Camera.call(this, mat4.orthographic(this.left, this.right, this.bottom, this.top, this.near, this.far), position, target);
    
}
OrthographicCamera.prototype = Object.create(Camera.prototype);
OrthographicCamera.prototype.constructor = OrthographicCamera;

OrthographicCamera.prototype.bindCamera = function(boundingSphere) {
    this.projection = mat4.orthographic(-1, 1, -1, 1, -1, 1);
    let viewProjection = this.getViewProjectionMatrix();
    let sphereCenter = viewProjection.multiply(new vec4(boundingSphere.center, 1));
    let cameraSize = 2*boundingSphere.radius;
    let textureSize = 1024;
    let pixelSize = cameraSize / textureSize;
    let xmin = Math.floor((sphereCenter.x-boundingSphere.radius)/pixelSize)*pixelSize;
    let xmax = Math.floor((sphereCenter.x+boundingSphere.radius)/pixelSize)*pixelSize;
    let ymin = Math.floor((sphereCenter.y-boundingSphere.radius)/pixelSize)*pixelSize;
    let ymax = Math.floor((sphereCenter.y+boundingSphere.radius)/pixelSize)*pixelSize;
    this.projection = mat4.orthographic(xmin, xmax, ymin, ymax, -2000, 2000);
};