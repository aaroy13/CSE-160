import Camera from "./Camera.js";
import Cube from "./Cube.js";

const VSHADER_SOURCE =`
  attribute vec3 a_Position;
  attribute vec2 uv;

  attribute vec3 a_Offset;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  varying vec2 vUv;

  void main() {
    vUv = uv;

    vec4 pos = vec4(a_Position + a_Offset, 1.0);

    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * pos;
  }`;

const FSHADER_SOURCE = `
  #ifdef GL_ES
  precision mediump float;
  #endif

  varying vec2 vUv;

  uniform sampler2D u_Sampler;
  uniform vec4 baseColor;
  uniform float u_texColorWeight;

  void main() {
    vec4 texColor = texture2D(u_Sampler, vUv);
    gl_FragColor = (1.0 - u_texColorWeight) * baseColor + u_texColorWeight * texColor;
  }`;

const SIZE = 32;

const worldMap = new Array(SIZE).fill(0).map(() => new Array(SIZE).fill(0));

// border walls
for (let i = 0; i < SIZE; i++) {
  worldMap[0][i] = 2;
  worldMap[SIZE - 1][i] = 2;
  worldMap[i][0] = 2;
  worldMap[i][SIZE - 1] = 2;
}


// random blocks inside
for (let i = 0; i < 15; i++) {
  let x = Math.floor(Math.random() * (SIZE - 2)) + 1;
  let z = Math.floor(Math.random() * (SIZE - 2)) + 1;
  worldMap[x][z] = 1;
}

function loadTexture(gl, program, src, renderScene) {
  var glTexture = gl.createTexture();

  var imgTag = new Image();
  imgTag.src = src;

  imgTag.onload = function() {
    console.log("image loaded");

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    gl.activeTexture(gl.TEXTURE0);

    gl.bindTexture(gl.TEXTURE_2D, glTexture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      imgTag
    );

    let u_Sampler = gl.getUniformLocation(gl.program, "u_Sampler");
    gl.uniform1i(u_Sampler, 0);
    let u_texColorWeight = gl.getUniformLocation(gl.program, "u_texColorWeight");
    let baseColor = gl.getUniformLocation(gl.program, "baseColor");

    gl.uniform1f(u_texColorWeight, 1.0);
    gl.uniform4f(baseColor, 0.0, 0.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    renderScene();
  };
}

function main() {
  const canvas = document.getElementById('webgl');
  const gl = getWebGLContext(canvas);

  if (!gl) {
    console.log('Failed to get WebGL context');
    return;
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders');
    return;
  }
  gl.enable(gl.DEPTH_TEST);

  const program = gl.program;

  program.a_Position = gl.getAttribLocation(program, "a_Position");
  program.uv = gl.getAttribLocation(program, "uv");
  program.a_Offset = gl.getAttribLocation(program, "a_Offset");

  program.u_ModelMatrix = gl.getUniformLocation(program, "u_ModelMatrix");
  program.u_ViewMatrix = gl.getUniformLocation(program, "u_ViewMatrix");
  program.u_ProjectionMatrix = gl.getUniformLocation(program, "u_ProjectionMatrix");
  program.u_texColorWeight = gl.getUniformLocation(program, "u_texColorWeight");
  program.baseColor = gl.getUniformLocation(program, "baseColor");
  const camera = new Camera(canvas);

  let sky = new Cube();

  let ground = new Cube();
  ground.matrix.setIdentity();
  ground.matrix.translate(0, -1, 0);
  ground.matrix.scale(32, 0.1, 32);

  let wallPositions = [];

  for (let x = 0; x < worldMap.length; x++) {
    for (let z = 0; z < worldMap[x].length; z++) {
      let height = worldMap[x][z];

      for (let y = 0; y < height; y++) {
        let offset = SIZE / 2;
        wallPositions.push(x - offset, y - 0.5, z - offset);
      }
    }
  }

  const ext = gl.getExtension("ANGLE_instanced_arrays");

  if (!ext) {
    console.log("Instanced drawing not supported");
  }

  function renderScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(program.u_ViewMatrix, false, camera.viewMatrix.elements);


    // skybox
    gl.depthMask(false);
    gl.disable(gl.DEPTH_TEST);

    gl.uniform1f(program.u_texColorWeight, 0.0);
    gl.uniform4f(program.baseColor, 0.53, 0.7, 0.98, 1.0);

    sky.matrix.setIdentity();
    sky.matrix.scale(80, 80, 80);
    sky.render(gl, program);

    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);

    // ground
    gl.uniform1f(program.u_texColorWeight, 0.0);
    gl.uniform4f(program.baseColor, 94/255, 157/255, 52/255, 1.0);
    ground.render(gl, program);

    // walls
    gl.uniform1f(program.u_texColorWeight, 1.0);

    Cube.renderInstances(gl, program, ext, wallPositions);

  }

  document.onkeydown = function(ev) {
    if (ev.key === 'w') camera.moveForward();
    if (ev.key === 's') camera.moveBackwards();
    if (ev.key === 'a') camera.moveLeft();
    if (ev.key === 'd') camera.moveRight();
    if (ev.key === 'q') camera.panLeft();
    if (ev.key === 'e') camera.panRight();

    renderScene();
  };
  let lastMouseX = null;

  canvas.onmousemove = function(ev) {
    if (lastMouseX === null) {
      lastMouseX = ev.clientX;
      return;
    }

    let dx = ev.clientX - lastMouseX;
    lastMouseX = ev.clientX;

    camera.panHorizontal(-dx * 0.2);
    renderScene();
  };

  let modelMatrix = new Matrix4();
  modelMatrix.setIdentity();


  gl.uniformMatrix4fv(program.u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(program.u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(program.u_ProjectionMatrix, false, camera.projectionMatrix.elements);

  //const n = initVertexBuffers(gl);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  loadTexture(gl, program, "../imgs/dirt.png", renderScene);
}

/*
function initVertexBuffers(gl) {
  const verticesUV = new Float32Array([
    // x, y, z,      u, v

    // first triangle
    -0.5, -0.5, 0.0,  0.0, 0.0,
     0.5, -0.5, 0.0,  1.0, 0.0,
     0.5,  0.5, 0.0,  1.0, 1.0,

    // second triangle
    -0.5, -0.5, 0.0,  0.0, 0.0,
     0.5,  0.5, 0.0,  1.0, 1.0,
    -0.5,  0.5, 0.0,  0.0, 1.0,
  ]);

  const n = 6;

  const vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log("Failed to create buffer");
    return -1;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesUV, gl.STATIC_DRAW);

  const FSIZE = verticesUV.BYTES_PER_ELEMENT;

  const aPosition = gl.getAttribLocation(gl.program, "a_Position");
  if (aPosition < 0) {
    console.log("Failed to get aPosition");
    return -1;
  }

  gl.vertexAttribPointer(
    aPosition,
    3,
    gl.FLOAT,
    false,
    FSIZE * 5,
    0
  );
  gl.enableVertexAttribArray(aPosition);

  const uv = gl.getAttribLocation(gl.program, "uv");
  if (uv < 0) {
    console.log("Failed to get uv");
    return -1;
  }

  gl.vertexAttribPointer(
    uv,
    2,
    gl.FLOAT,
    false,
    FSIZE * 5,
    FSIZE * 3
  );
  gl.enableVertexAttribArray(uv);

  return n;
}
*/
main();