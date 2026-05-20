export default class Cube {
  static vertexBuffer = null;

  constructor() {
    this.matrix = new Matrix4();
  }

  static initBuffer(gl) {
    if (Cube.vertexBuffer !== null) return;

    const verticesUV = new Float32Array([

      // front
      -0.5,-0.5,0.5, 0,0,   0,0,1,
      0.5,-0.5,0.5, 1,0,   0,0,1,
      0.5, 0.5,0.5, 1,1,   0,0,1,

      -0.5,-0.5,0.5, 0,0,   0,0,1,
      0.5, 0.5,0.5, 1,1,   0,0,1,
      -0.5, 0.5,0.5, 0,1,   0,0,1,


      // back
      0.5,-0.5,-0.5,0,0,   0,0,-1,
      -0.5,-0.5,-0.5,1,0,   0,0,-1,
      -0.5,0.5,-0.5, 1,1,   0,0,-1,

      0.5,-0.5,-0.5,0,0,   0,0,-1,
      -0.5,0.5,-0.5, 1,1,   0,0,-1,
      0.5,0.5,-0.5, 0,1,   0,0,-1,


      // left
      -0.5,-0.5,-0.5,0,0,  -1,0,0,
      -0.5,-0.5,0.5, 1,0,  -1,0,0,
      -0.5,0.5,0.5,  1,1,  -1,0,0,

      -0.5,-0.5,-0.5,0,0,  -1,0,0,
      -0.5,0.5,0.5,  1,1,  -1,0,0,
      -0.5,0.5,-0.5, 0,1,  -1,0,0,


      // right
      0.5,-0.5,0.5,0,0,   1,0,0,
      0.5,-0.5,-0.5,1,0,  1,0,0,
      0.5,0.5,-0.5,1,1,   1,0,0,

      0.5,-0.5,0.5,0,0,   1,0,0,
      0.5,0.5,-0.5,1,1,   1,0,0,
      0.5,0.5,0.5,0,1,    1,0,0,


      // top
      -0.5,0.5,0.5,0,0,   0,1,0,
      0.5,0.5,0.5,1,0,    0,1,0,
      0.5,0.5,-0.5,1,1,   0,1,0,

      -0.5,0.5,0.5,0,0,   0,1,0,
      0.5,0.5,-0.5,1,1,   0,1,0,
      -0.5,0.5,-0.5,0,1,  0,1,0,


      // bottom
      -0.5,-0.5,-0.5,0,0,  0,-1,0,
      0.5,-0.5,-0.5,1,0,   0,-1,0,
      0.5,-0.5,0.5,1,1,    0,-1,0,

      -0.5,-0.5,-0.5,0,0,  0,-1,0,
      0.5,-0.5,0.5,1,1,    0,-1,0,
      -0.5,-0.5,0.5,0,1,   0,-1,0,

    ]);

    Cube.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesUV, gl.STATIC_DRAW);
  }

  render(gl, program) {
    Cube.initBuffer(gl);

    const FSIZE = Float32Array.BYTES_PER_ELEMENT;

    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.vertexBuffer);

    gl.vertexAttribPointer(program.a_Position, 3, gl.FLOAT, false, FSIZE * 8, 0);
    gl.enableVertexAttribArray(program.a_Position);

    gl.vertexAttribPointer(program.uv, 2, gl.FLOAT, false, FSIZE * 8, FSIZE * 3);
    gl.enableVertexAttribArray(program.uv);

    gl.vertexAttribPointer(program.a_Normal, 3, gl.FLOAT, false, FSIZE * 8, FSIZE * 5);
    gl.enableVertexAttribArray(program.a_Normal);

    if (program.a_Offset >= 0) {
        gl.disableVertexAttribArray(program.a_Offset);
        gl.vertexAttrib3f(program.a_Offset, 0, 0, 0);
    }

    gl.uniformMatrix4fv(program.u_ModelMatrix, false, this.matrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, 36);

  }

  static renderInstances(gl, program, ext, positions) {
    Cube.initBuffer(gl);

    const FSIZE = Float32Array.BYTES_PER_ELEMENT;

    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.vertexBuffer);

    gl.vertexAttribPointer(program.a_Position, 3, gl.FLOAT, false, FSIZE * 8, 0);
    gl.enableVertexAttribArray(program.a_Position);

    gl.vertexAttribPointer(program.uv, 2, gl.FLOAT, false, FSIZE * 8, FSIZE * 3);
    gl.enableVertexAttribArray(program.uv);
    gl.vertexAttribPointer(program.a_Normal, 3, gl.FLOAT, false, FSIZE * 8, FSIZE * 5);
    gl.enableVertexAttribArray(program.a_Normal);

    let offsetBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    gl.vertexAttribPointer(program.a_Offset, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.a_Offset);

    ext.vertexAttribDivisorANGLE(program.a_Offset, 1);

    let identity = new Matrix4();
    identity.setIdentity();
    gl.uniformMatrix4fv(program.u_ModelMatrix, false, identity.elements);

    let normalMatrix = new Matrix4();
    normalMatrix.setIdentity();
    gl.uniformMatrix4fv(program.u_NormalMatrix, false, normalMatrix.elements);

    ext.drawArraysInstancedANGLE(
        gl.TRIANGLES,
        0,
        36,
        positions.length / 3
    );

    ext.vertexAttribDivisorANGLE(program.a_Offset, 0);
    gl.disableVertexAttribArray(program.a_Offset);
    }
}
