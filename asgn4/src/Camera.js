export default class Camera {
  constructor(canvas) {
    this.fov = 60;
    this.eye = new Vector3([0, 0, 2]);
    this.at = new Vector3([0, 0, 0]);
    this.up = new Vector3([0, 1, 0]);

    this.speed = 0.2;
    this.alpha = 5;

    this.velocityY = 0;
    this.isJumping = false;
    this.gravity = -0.02;

    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();

    this.updateViewMatrix();
    this.projectionMatrix.setPerspective(
      this.fov,
      canvas.width / canvas.height,
      0.1,
      100
    );
  }

  updateViewMatrix() {
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0], this.at.elements[1], this.at.elements[2],
      this.up.elements[0], this.up.elements[1], this.up.elements[2]
    );
  }

  moveForward() {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);

    // ignore vertical movement
    f.elements[1] = 0;

    f.normalize();
    f.mul(this.speed);

    this.eye.add(f);
    this.at.add(f);

    this.updateViewMatrix();
  }

  moveBackwards() {
    let b = new Vector3();
    b.set(this.eye);
    b.sub(this.at);

    // ignore vertical movement
    b.elements[1] = 0;

    b.normalize();
    b.mul(this.speed);

    this.eye.add(b);
    this.at.add(b);

    this.updateViewMatrix();
  }

  moveLeft() {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);

    let s = Vector3.cross(this.up, f);
    s.normalize();
    s.mul(this.speed);

    this.eye.add(s);
    this.at.add(s);

    this.updateViewMatrix();
  }

  moveRight() {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);

    let s = Vector3.cross(f, this.up);
    s.normalize();
    s.mul(this.speed);

    this.eye.add(s);
    this.at.add(s);

    this.updateViewMatrix();
  }

  panLeft() {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);

    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(
      this.alpha,
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2]
    );

    let fPrime = rotationMatrix.multiplyVector3(f);

    this.at.set(this.eye);
    this.at.add(fPrime);

    this.updateViewMatrix();
  }

  panRight() {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);

    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(
      -this.alpha,
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2]
    );

    let fPrime = rotationMatrix.multiplyVector3(f);

    this.at.set(this.eye);
    this.at.add(fPrime);

    this.updateViewMatrix();
  }

  panHorizontal(angle) {
    let f = new Vector3();
      f.set(this.at);
      f.sub(this.eye);

    let rotationMatrix = new Matrix4();
      rotationMatrix.setRotate(
        angle,
        this.up.elements[0],
        this.up.elements[1],
        this.up.elements[2]
      );

    let fPrime = rotationMatrix.multiplyVector3(f);

    this.at.set(this.eye);
    this.at.add(fPrime);

    this.updateViewMatrix();
  }


  panVertical(angle) {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);

    let right = Vector3.cross(f, this.up);
    right.normalize();

    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(
        angle,
        right.elements[0],
        right.elements[1],
        right.elements[2]
    );

    let fPrime = rotationMatrix.multiplyVector3(f);

    this.at.set(this.eye);
    this.at.add(fPrime);

    this.updateViewMatrix();
    }


    updateJump(groundHeight = 0) {
        let floorY = groundHeight;

        this.velocityY += this.gravity;

        this.eye.elements[1] += this.velocityY;
        this.at.elements[1] += this.velocityY;

        if (this.eye.elements[1] <= floorY) {
            let diff = floorY - this.eye.elements[1];

            this.eye.elements[1] += diff;
            this.at.elements[1] += diff;

            this.velocityY = 0;
            this.isJumping = false;
        }

        this.updateViewMatrix();
    }

}

    


