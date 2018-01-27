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
    let right = args.right || (args.width ? args.width+left : 640+left);
    let bottom = args.bottom || (args.height ? args.height+top : 480+top);
    let near = args.near || -400;
    let far = args.far || 400;
    Camera.call(this, mat4.orthographic(left, right, bottom, top, near, far), position, target);
    
}
OrthographicCamera.prototype = Object.create(Camera.prototype);
OrthographicCamera.prototype.constructor = OrthographicCamera;

OrthographicCamera.prototype.bindCamera = function(vertices) {
    this.projection = mat4.orthographic(-1, 1, -1, 1, -1, 1);
    let viewProjection = this.getViewProjectionMatrix();
    let e = {xmin: Infinity, xmax: -Infinity, ymin: Infinity, ymax: -Infinity, zmin: Infinity, zmax: -Infinity};
    for(let i=0; i<vertices.length; i++) {
        let tVertex = viewProjection.multiply(vertices[i]);
        //console.log(i + " " + tVertex.x + "," + tVertex.y + "," + tVertex.z);
        if(tVertex.x < e.xmin) {e.xmin = tVertex.x;}
        if(tVertex.x > e.xmax) {e.xmax = tVertex.x;}
        if(tVertex.y < e.ymin) {e.ymin = tVertex.y;}
        if(tVertex.y > e.ymax) {e.ymax = tVertex.y;}
        if(tVertex.z < e.zmin) {e.zmin = tVertex.z;}
        if(tVertex.z > e.zmax) {e.zmax = tVertex.z;}
    }
    //console.log(e);
    this.projection = mat4.orthographic(e.xmin, e.xmax, e.ymin, e.ymax, e.zmin, e.zmax);
};