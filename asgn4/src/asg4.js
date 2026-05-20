import Camera from "./Camera.js";
import Cube from "./Cube.js";
import Model from "./Model.js";
import Sphere from "./Sphere.js";

const VSHADER_SOURCE =`
  attribute vec3 a_Position;
  attribute vec2 uv;
  uniform float u_UVScale;

  varying vec4 v_Position;
  attribute vec3 a_Offset;

  attribute vec3 a_Normal;
  uniform mat4 u_NormalMatrix;
  varying vec3 v_Normal;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform vec3 u_LightPos;
  varying vec3 v_NormalDir;
  varying vec3 v_LightDir;
  varying vec2 vUv;
  uniform vec3 u_CameraPos;
  varying vec3 v_ViewDir;
  uniform vec3 u_LightColor;
  varying vec3 v_LightColor;

  void main() {
    vUv = uv * u_UVScale;

    vec4 pos = vec4(a_Position + a_Offset, 1.0);

    v_Position = u_ViewMatrix * u_ModelMatrix * pos;

    vec4 worldPos = u_ModelMatrix * pos;
    v_ViewDir = normalize(u_CameraPos - worldPos.xyz);
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0)));

    v_NormalDir = v_Normal;
    v_LightDir = normalize(u_LightPos - worldPos.xyz);
    v_LightColor = u_LightColor;

    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * pos;
  }`;

const FSHADER_SOURCE = `
  #ifdef GL_ES
  precision mediump float;
  #endif

  varying vec2 vUv;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;

  uniform vec3 u_FogColor;
  uniform float u_FogNear;
  uniform float u_FogFar;
  uniform int u_LightOn;
  

  varying vec4 v_Position;

  uniform vec4 baseColor;
  uniform float u_texColorWeight;
  uniform int u_WhichTexture;
  varying vec3 v_NormalDir;
  varying vec3 v_LightDir;

  varying vec3 v_Normal;
  uniform int u_NormalOn;
  varying vec3 v_ViewDir;
  varying vec3 v_LightColor;

  void main() {
    vec4 texColor;

    if (u_WhichTexture == 0) {
      texColor = texture2D(u_Sampler0, vUv);
    } else if (u_WhichTexture == 1) {
      texColor = texture2D(u_Sampler1, vUv);
    } else if (u_WhichTexture == 2) {
      texColor = texture2D(u_Sampler2, vUv);
    } else {
      texColor = baseColor;
    } 

    vec4 color = (1.0 - u_texColorWeight) * baseColor + u_texColorWeight * texColor;

    float dist = length(v_Position.xyz);

    float fogFactor = clamp(
      (u_FogFar - dist) / (u_FogFar - u_FogNear),
      0.0,
      1.0
    );

    vec3 finalColor = mix(u_FogColor, color.rgb, fogFactor);

    if (u_NormalOn == 1) {
      gl_FragColor = vec4(v_Normal * 0.5 + 0.5, 1.0);
      return;
    }

    if (u_LightOn == 0) {
      gl_FragColor = vec4(finalColor, color.a);
      return;
    }

    vec3 N = normalize(v_NormalDir);
    vec3 L = normalize(v_LightDir);
    vec3 V = normalize(v_ViewDir);

    float nDotL = max(dot(N,L),0.0);

    vec3 ambient = finalColor * 0.3;

    vec3 diffuse = finalColor * nDotL * v_LightColor;

    vec3 R = reflect(-L,N);

    float spec =
    pow(max(dot(V,R),0.0),32.0);

    vec3 specular = v_LightColor * 0.2 * spec;

    vec3 result =
    ambient +
    diffuse +
    specular;

    gl_FragColor =
    vec4(result,color.a);
  }`;

const SIZE = 32;
let wowMode = false;
let diamondCollected = false;
let wowMessage = "";
let g_lightPos = [0, 2, -4];
let g_lightColor = [1,1,1];
let g_lightOn = true;

let caveSound = new Audio("../sound/cave.mp3");
let caveSound2 = new Audio("../sound/cave2.mp3");

let caveSoundIndex = 0;
let caveIntervalStarted = false;

let endermanTeleportStarted = false;

let endermanPos = {
  x: 0,
  z: -5
};

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

const treasure = {
  x: Math.floor(Math.random() * (SIZE - 4)) + 2,
  z: Math.floor(Math.random() * (SIZE - 4)) + 2
};

worldMap[treasure.x][treasure.z] = 1;

worldMap[treasure.x + 1][treasure.z] = 1;
worldMap[treasure.x - 1][treasure.z] = 1;
worldMap[treasure.x][treasure.z + 1] = 1;
worldMap[treasure.x][treasure.z - 1] = 1;

function teleportEnderman() {
  endermanPos.x = (Math.random() * 12) - 6;
  endermanPos.z = -(Math.random() * 12 + 3);
}

function startEndermanTeleport() {
  if (endermanTeleportStarted) return;

  endermanTeleportStarted = true;
  teleportEnderman();

  setInterval(() => {
    teleportEnderman();
  }, 3000);
}

function loadTexture(gl, program, src, textureUnit, renderScene) {  let texture = gl.createTexture();
  let image = new Image();

  image.onload = function() {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      image
    );

    // if (textureUnit === 0) {
    //   gl.uniform1i(program.u_Sampler0, 0);
    // } else if (textureUnit === 1) {
    //   gl.uniform1i(program.u_Sampler1, 1);
    // }
    renderScene();

  };

  image.src = src;
}

function getTargetBlock(camera) {
  let dir = new Vector3();
  dir.set(camera.at);
  dir.sub(camera.eye);
  dir.normalize();

  let lastEmpty = null;

  for (let t = 0.2; t < 8; t += 0.2) {
    let worldX = camera.eye.elements[0] + dir.elements[0] * t;
    let worldY = camera.eye.elements[1] + dir.elements[1] * t;
    let worldZ = camera.eye.elements[2] + dir.elements[2] * t;

    let x = Math.floor(worldX + SIZE / 2);
    let z = Math.floor(worldZ + SIZE / 2);
    let y = Math.floor(worldY + 1);

    if (x < 0 || x >= SIZE || z < 0 || z >= SIZE || y < 0) continue;

    if (y < worldMap[x][z]) {
      return { x, y, z, placeX: lastEmpty?.x ?? x, placeZ: lastEmpty?.z ?? z };
    }

    lastEmpty = { x, y, z };
  }

  // lets you place on grass/empty ground
  if (lastEmpty !== null) {
    return { x: lastEmpty.x, y: -1, z: lastEmpty.z, placeX: lastEmpty.x, placeZ: lastEmpty.z };
  }

  return null;
}

function getGroundHeightUnderPlayer(camera) {
  let x = getMapX(camera.eye.elements[0]);
  let z = getMapZ(camera.eye.elements[2]);

  if (x < 0 || x >= SIZE || z < 0 || z >= SIZE) {
    return 0;
  }

  return worldMap[x][z];
}

function getMapHeightAt(worldX, worldZ) {
  let x = Math.floor(worldX + SIZE / 2);
  let z = Math.floor(worldZ + SIZE / 2);

  if (x < 0 || x >= SIZE || z < 0 || z >= SIZE) {
    return 999; // outside map = wall
  }

  return worldMap[x][z];
}

function tryMove(camera, moveFunc) {
  let oldEye = new Vector3();
  oldEye.set(camera.eye);

  let oldAt = new Vector3();
  oldAt.set(camera.at);

  moveFunc();

  let newX = camera.eye.elements[0];
  let newZ = camera.eye.elements[2];

  if (!canStandAt(camera, newX, newZ)) {
    camera.eye.set(oldEye);
    camera.at.set(oldAt);
  }

  camera.updateViewMatrix();
}

const PLAYER_RADIUS = 0.25;
const STEP_HEIGHT = 1;

function getMapX(worldX) {
  return Math.floor(worldX + SIZE / 2);
}

function getMapZ(worldZ) {
  return Math.floor(worldZ + SIZE / 2);
}

function getHeightAt(worldX, worldZ) {
  let x = getMapX(worldX);
  let z = getMapZ(worldZ);

  if (x < 0 || x >= SIZE || z < 0 || z >= SIZE) {
    return 999;
  }

  return worldMap[x][z];
}

function canStandAt(camera, worldX, worldZ) {
  let currentGround = Math.floor(camera.eye.elements[1]);

  let points = [
    [worldX - PLAYER_RADIUS, worldZ - PLAYER_RADIUS],
    [worldX + PLAYER_RADIUS, worldZ - PLAYER_RADIUS],
    [worldX - PLAYER_RADIUS, worldZ + PLAYER_RADIUS],
    [worldX + PLAYER_RADIUS, worldZ + PLAYER_RADIUS],
  ];

  for (let p of points) {
    let h = getHeightAt(p[0], p[1]);

    if (h > currentGround + STEP_HEIGHT) {
      return false;
    }
  }

  return true;
}

function playCaveSoundLoop() {
  if (caveIntervalStarted) return;

  caveIntervalStarted = true;

  function playFirstThenSecond() {
    caveSound.currentTime = 0;
    caveSound.play();

    setTimeout(() => {
      caveSound2.currentTime = 0;
      caveSound2.play();
    }, 4000);
  }

  playFirstThenSecond();

  setInterval(playFirstThenSecond, 10000);
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
  program.u_LightPos = gl.getUniformLocation(program, "u_LightPos");
  program.u_CameraPos = gl.getUniformLocation(program, "u_CameraPos");
  program.u_LightColor = gl.getUniformLocation(program, "u_LightColor");
  program.u_ModelMatrix = gl.getUniformLocation(program, "u_ModelMatrix");
  program.u_ViewMatrix = gl.getUniformLocation(program, "u_ViewMatrix");
  program.u_ProjectionMatrix = gl.getUniformLocation(program, "u_ProjectionMatrix");
  program.u_texColorWeight = gl.getUniformLocation(program, "u_texColorWeight");
  program.baseColor = gl.getUniformLocation(program, "baseColor");
  program.u_WhichTexture = gl.getUniformLocation(program, "u_WhichTexture");
  program.u_UVScale = gl.getUniformLocation(program, "u_UVScale");
  program.u_Sampler0 = gl.getUniformLocation(program, "u_Sampler0");
  program.u_Sampler1 = gl.getUniformLocation(program, "u_Sampler1");
  program.u_Sampler2 = gl.getUniformLocation(program, "u_Sampler2");

  program.u_FogColor = gl.getUniformLocation(program, "u_FogColor");
  program.u_FogNear = gl.getUniformLocation(program, "u_FogNear");
  program.u_FogFar = gl.getUniformLocation(program, "u_FogFar");
  program.a_Normal = gl.getAttribLocation(program, "a_Normal");
  program.u_NormalMatrix = gl.getUniformLocation(program, "u_NormalMatrix");
  program.u_NormalOn = gl.getUniformLocation(program, "u_NormalOn");
  program.u_LightOn = gl.getUniformLocation(program, "u_LightOn");

  gl.uniform1i(program.u_Sampler0, 0);
  gl.uniform1i(program.u_Sampler1, 1);
  gl.uniform1i(program.u_Sampler2, 2);
  const camera = new Camera(canvas);

  let enderman = new Model(gl, "../model/minecraft_-_enderman.obj");

  let sky = new Cube();

  let ground = new Cube();
  ground.matrix.setIdentity();
  ground.matrix.translate(0, -1, 0);
  ground.matrix.scale(32, 0.1, 32);

  let sphere = new Sphere();
  sphere.matrix.setIdentity();
  sphere.matrix.translate(2, -.5, -3);
  sphere.matrix.scale(.5, .5, .5);
  let lightCube = new Cube();

  let wallPositions = [];
  let normalOn = false;

  function rebuildWalls() {
    wallPositions = [];

    for (let x = 0; x < worldMap.length; x++) {
      for (let z = 0; z < worldMap[x].length; z++) {
        let height = worldMap[x][z];

        for (let y = 0; y < height; y++) {
          let offset = SIZE / 2;

          if (!(x === treasure.x && z === treasure.z && y === 0)) {
            wallPositions.push(x - offset, y - 0.5, z - offset);
          }
        }
      }
    }
  }

  rebuildWalls();

  const ext = gl.getExtension("ANGLE_instanced_arrays");

  if (!ext) {
    console.log("Instanced drawing not supported");
  }

  function renderScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(program.u_ViewMatrix, false, camera.viewMatrix.elements);

    gl.uniform1i(program.u_NormalOn, normalOn ? 1 : 0);
    gl.uniform1i(program.u_LightOn, g_lightOn ? 1 : 0);
    gl.uniform3f(program.u_LightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    gl.uniform3f(program.u_CameraPos, camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2]);
    gl.uniform3f(program.u_LightColor, g_lightColor[0], g_lightColor[1], g_lightColor[2]);

    if (wowMode) {
      gl.uniform3f(program.u_FogColor, 0.65, 0.65, 0.7);
      gl.uniform1f(program.u_FogNear, 8.0);
      gl.uniform1f(program.u_FogFar, 28.0);
    } else {
      gl.uniform3f(program.u_FogColor, 0.53, 0.7, 0.98);
      gl.uniform1f(program.u_FogNear, 100.0);
      gl.uniform1f(program.u_FogFar, 101.0);
    }


    // skybox
    gl.depthMask(false);
    gl.disable(gl.DEPTH_TEST);

    gl.uniform1f(program.u_UVScale, 1.0);
    gl.uniform1i(program.u_WhichTexture, -1);

    if (wowMode) {
      gl.uniform4f(program.baseColor, 0.02, 0.02, 0.08, 1.0);
    } else {
      gl.uniform4f(program.baseColor, 0.53, 0.7, 0.98, 1.0);
    }

    sky.matrix.setIdentity();
    sky.matrix.scale(80, 80, 80);
    sky.render(gl, program);

    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);

    // ground
    gl.uniform1i(program.u_WhichTexture, 1);
    gl.uniform1f(program.u_texColorWeight, 1.0);
    gl.uniform1f(program.u_UVScale, 32.0);
    ground.render(gl, program);

    gl.uniform1i(program.u_WhichTexture, -1);
    gl.uniform4f(program.baseColor, 1.0, 0.5, 0.2, 1.0);
    gl.uniform1f(program.u_texColorWeight, 0.0);

    sphere.render(gl, program);

    // walls
    gl.uniform1i(program.u_WhichTexture, 2);
    gl.uniform1f(program.u_texColorWeight, 1.0);
    gl.uniform1f(program.u_UVScale, 1.0);
    Cube.renderInstances(gl, program, ext, wallPositions);

    //diamond block
    if (!diamondCollected) {
      let diamond = new Cube();

      diamond.matrix.setIdentity();

      let offset = SIZE / 2;

      diamond.matrix.translate(
        treasure.x - offset,
        -0.5,
        treasure.z - offset
      );

      gl.uniform1i(program.u_WhichTexture, 0);
      gl.uniform1f(program.u_UVScale, 1.0);
      gl.uniform1f(program.u_texColorWeight, 1.0);

      diamond.render(gl, program);
    }

    // enderman test
    if (wowMode && enderman.isFullyLoaded) {
      enderman.matrix.setIdentity();

      enderman.matrix.translate(endermanPos.x, 0.3, endermanPos.z);
      enderman.matrix.scale(0.06, 0.06, 0.06);

      gl.uniform1i(program.u_WhichTexture, -1);
      gl.uniform4f(program.baseColor, 0.02, 0.02, 0.02, 1.0);
      gl.uniform1f(program.u_texColorWeight, 0.0);

      enderman.render(gl, program);

      // glowing eyes
      let eye1 = new Cube();
      eye1.matrix.setIdentity();
      eye1.matrix.translate(endermanPos.x + 0.15, 1.5, endermanPos.z + 0.24);
      eye1.matrix.scale(0.16, 0.05, 0.02);

      gl.uniform1i(program.u_WhichTexture, -1);
      gl.uniform4f(program.baseColor, 0.63, 0.0, 1.0, 1.0);
      gl.uniform1f(program.u_texColorWeight, 0.0);
      eye1.render(gl, program);

      let eye2 = new Cube();
      eye2.matrix.setIdentity();
      eye2.matrix.translate(endermanPos.x - 0.15, 1.5, endermanPos.z + 0.24);
      eye2.matrix.scale(0.16, 0.05, 0.02);

      gl.uniform4f(program.baseColor, 0.63, 0.0, 1.0, 1.0);
      eye2.render(gl, program);
    }

    lightCube.matrix.setIdentity();

    lightCube.matrix.translate(
        g_lightPos[0],
        g_lightPos[1],
        g_lightPos[2]
    );

    lightCube.matrix.scale(
        0.2,
        0.2,
        0.2
    );

    gl.uniform1i(program.u_WhichTexture,-1);

    gl.uniform4f(
        program.baseColor,
        1,1,0,1
    );

    gl.uniform1f(
        program.u_texColorWeight,
        0
    );

    lightCube.render(gl,program);
  }

  
  let keys = {};

  document.onkeydown = function(ev) {
    
    keys[ev.key] = true;

  if (ev.key === ' ') {
    ev.preventDefault();

    if (!camera.isJumping) {
      camera.velocityY = 0.22;
      camera.isJumping = true;
    }
  }

  if (ev.key === 'q') camera.panLeft();
  if (ev.key === 'e') camera.panRight();

  if (ev.key === 'f') {
    let block = getTargetBlock(camera);

    if (block !== null) {
      let x = block.placeX;
      let z = block.placeZ;

      if (x >= 0 && x < SIZE && z >= 0 && z < SIZE) {
        worldMap[x][z]++;
        rebuildWalls();
      }
    }
  }

  if (ev.key === 'g') {
    let block = getTargetBlock(camera);

    if (block !== null) {
      if (
        block.x === treasure.x &&
        block.z === treasure.z &&
        worldMap[treasure.x][treasure.z] === 0
      ) {
        wowMode = true;
        diamondCollected = true;
        wowMessage = "Wow mode activated!";
        playCaveSoundLoop();
        startEndermanTeleport();
        return;
      }

      if (worldMap[block.x][block.z] > 0) {
        worldMap[block.x][block.z]--;

        if (
          block.x === treasure.x &&
          block.z === treasure.z &&
          worldMap[block.x][block.z] === 0
        ) {
          wowMode = true;
          diamondCollected = true;
          wowMessage = "Wow mode activated!";
          playCaveSoundLoop();
          startEndermanTeleport();

          alert(wowMessage);
        }

        rebuildWalls();
      }
    }
    
  }

    
};

document.onkeyup = function(ev) {
  keys[ev.key] = false;
};

document.getElementById("normalButton").onclick = function() {
  normalOn = !normalOn;
  this.innerText = normalOn ? "Normal View: On" : "Normal View: Off";
};
document.getElementById("lightButton").onclick = function() {
  g_lightOn = !g_lightOn;
  this.innerText = g_lightOn ? "Lighting: On" : "Lighting: Off";
};
document.getElementById("lightSlideX").addEventListener("mousemove", function() {
    g_lightPos[0] = Number(this.value);
});

document.getElementById("lightSlideY").addEventListener("mousemove", function() {
    g_lightPos[1] = Number(this.value);
});

document.getElementById("lightSlideZ").addEventListener("mousemove", function() {
    g_lightPos[2] = Number(this.value);
});
document.getElementById("lightR").oninput=function(){ g_lightColor[0]=Number(this.value);};

document.getElementById("lightG").oninput=function(){ g_lightColor[1]=Number(this.value);};

document.getElementById("lightB").oninput=function(){ g_lightColor[2]=Number(this.value);};

  let lastMouseX = null;
  let lastMouseY = null;

  canvas.onmousemove = function(ev) {
    if (lastMouseX === null || lastMouseY === null) {
      lastMouseX = ev.clientX;
      lastMouseY = ev.clientY;
      return;
    }

    let dx = ev.clientX - lastMouseX;
    let dy = ev.clientY - lastMouseY;

    lastMouseX = ev.clientX;
    lastMouseY = ev.clientY;

    camera.panHorizontal(-dx * 0.2);
    camera.panVertical(-dy * 0.2);

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

  loadTexture(gl, program, "../imgs/dirt.png", 2, renderScene);
  loadTexture(gl, program, "../imgs/grass.png", 1, renderScene);
  loadTexture(gl, program, "../imgs/diamond.png", 0, renderScene);
  //renderScene();


  function tick() {
    if (keys['w']) tryMove(camera, () => camera.moveForward());
    if (keys['s']) tryMove(camera, () => camera.moveBackwards());
    if (keys['a']) tryMove(camera, () => camera.moveLeft());
    if (keys['d']) tryMove(camera, () => camera.moveRight());

    let groundHeight = getGroundHeightUnderPlayer(camera);
    camera.updateJump(groundHeight);

    g_lightPos[0] = 5 * Math.cos(performance.now()/1000);
    g_lightPos[2] = 5 * Math.sin(performance.now()/1000);

    renderScene();
    requestAnimationFrame(tick);
  }
  tick();
}


main();
