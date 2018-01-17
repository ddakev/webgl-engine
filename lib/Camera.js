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
}
Camera.prototype = Object.create(GameObject.prototype);
Camera.prototype.constructor = Camera;

Camera.prototype.getViewProjectionMatrix = function() {
    return this.getWorldMatrix().inverse().multiply(this.projection);
};

Camera.prototype.getMatrixWoTranslation = function() {
    return new mat4()//.rotate(new vec3(0, 1, 0), Math.atan(this.direction.x/this.direction.y) * 180 / Math.PI).rotate(new vec3(this.direction.x, 0, -this.direction.y).cross(new vec3(0, -1, 0)), Math.atan(this.direction.z/Math.sqrt(this.direction.x * this.direction.x + this.direction.y * this.direction.y)) * 180 / Math.PI)
                .multiply(mat4.lookAt(new vec3(), new vec3(this.getDirection().x, this.getDirection().z, -this.getDirection().y), new vec3(0, 1, 0)).inverse())
                .multiply(this.projection);
};



function PerspectiveCamera(args, position, target) {
    let fov = args.fov || args.fieldOfView || 60;
    let aspect = args.aspect || args.aspectRatio || args.aRatio || 640/480;
    let near = args.near || 1;
    let far = args.far || 2000;
    Camera.call(this, mat4.perspective(fov, aspect, near, far), position, target);
}
PerspectiveCamera.prototype = Object.create(Camera.prototype);
PerspectiveCamera.prototype.constructor = PerspectiveCamera;



function OrthographicCamera(args, position, target) {
    let left = args.left || 0;
    let top = args.top || 0;
    let right = args.right || args.width ? args.width+left : 640+left;
    let bottom = args.bottom || args.height ? args.height+top : 480+top;
    let near = args.near || -400;
    let far = args.far || 400;
    Camera.call(this, mat4.orthographic(left, right, bottom, top, near, far), position, target);
    
}
OrthographicCamera.prototype = Object.create(Camera.prototype);
OrthographicCamera.prototype.constructor = OrthographicCamera;