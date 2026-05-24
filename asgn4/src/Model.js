export default class Model {
  constructor(gl, filePath) {
    this.filePath = filePath;
    this.matrix = new Matrix4();

    this.vertices = [];
    this.uvs = [];
    this.isFullyLoaded = false;

    this.vertexBuffer = gl.createBuffer();
    this.uvBuffer = gl.createBuffer();
    this.normals = [];
    this.normalBuffer = gl.createBuffer();

    this.loadModel(gl);
    //console.log("OBJ loaded:", this.filePath, "vertices:", this.vertexCount);
  }

  async loadModel(gl) {
    const response = await fetch(this.filePath);
    const text = await response.text();

    this.parseOBJ(text);

    this.vertexCount = this.vertices.length / 3;
    console.log("OBJ loaded:", this.filePath, "vertices:", this.vertexCount);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvs), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);

    this.isFullyLoaded = true;
  }

  parseOBJ(text) {
    const positions = [];
    const texcoords = [];
    const normals = [];

    const lines = text.split("\n");

    for (let line of lines) {
      line = line.trim();

      if (line === "" || line.startsWith("#")) continue;

      const parts = line.split(/\s+/);

      if (parts[0] === "v") {
        positions.push([
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3]),
        ]);
      }

      else if (parts[0] === "vt") {
        texcoords.push([
          parseFloat(parts[1]),
          parseFloat(parts[2]),
        ]);
      }

      else if (parts[0] === "f") {
        const face = parts.slice(1);

        // triangulate faces like: 1 2 3 4
        for (let i = 1; i < face.length - 1; i++) {
          this.addVertex(face[0], positions, texcoords, normals);
          this.addVertex(face[i], positions, texcoords, normals);
          this.addVertex(face[i + 1], positions, texcoords, normals);
        }
      }
      else if (parts[0] === "vn") {
        normals.push([
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3]),
        ]);
      }
    }
  }

  addVertex(vertexData, positions, texcoords, normals) {
    
    const indices = vertexData.split("/");

    const positionIndex = parseInt(indices[0]) - 1;
    const texcoordIndex = indices[1] ? parseInt(indices[1]) - 1 : -1;
    const normalIndex = indices[2] ? parseInt(indices[2]) - 1 : -1;

    const position = positions[positionIndex];

    this.vertices.push(position[0], position[1], position[2]);

    if (texcoordIndex >= 0 && texcoords[texcoordIndex]) {
      const uv = texcoords[texcoordIndex];
      this.uvs.push(uv[0], uv[1]);
    } else {
      this.uvs.push(0, 0);
    }
    if (normalIndex >= 0 && normals[normalIndex]) {
      const normal = normals[normalIndex];
      this.normals.push(normal[0], normal[1], normal[2]);
    } else {
      this.normals.push(0, 1, 0);
    }
  }

  render(gl, program) {
    if (!this.isFullyLoaded) return;

    gl.uniformMatrix4fv(program.u_ModelMatrix, false, this.matrix.elements);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(program.a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.vertexAttribPointer(program.uv, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.uv);

    if (program.a_Offset >= 0) {
      gl.disableVertexAttribArray(program.a_Offset);
      gl.vertexAttrib3f(program.a_Offset, 0, 0, 0);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(program.a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.a_Normal);

    let normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(this.matrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(program.u_NormalMatrix, false, normalMatrix.elements);

    gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
  }
}