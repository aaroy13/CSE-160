var canvas;
var gl;
var a_Position;
var u_ModelMatrix;
var u_FragColor;
var cube;
var gTail1Angle = 25;
var gTail2Angle = 10;
var gTail3Angle = -10;
var gAnimation = false;
var gFrontLegAngle = 0;
var gBackLegAngle = 0;

var gEarAngle = 0;
var gNoseWiggle = 0;
var gBlink = 1;
var gWink = false;

var g_startTime = performance.now() / 1000.0;
var g_seconds = 0;

var gZoom = 1.0;
var gMouseRotX = 0;
var gMouseRotY = 0;
var gAnimalGlobalRotation = 0;
var gFrontLegManual = 0;
var gBackLegManual = 0;
var gEarManual = 0;
var gPoke = false;
var gPokeStart = 0;

var g_lastTime = performance.now();
var g_fps = 0;

var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_GlobalRotationMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_GlobalRotationMatrix * u_ModelMatrix * a_Position;\n' +
  '}\n';

var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

function main() {
  canvas = document.getElementById('webgl');
  gl = getWebGLContext(canvas);

  if (!gl) {
    console.log('Failed to get WebGL context');
    return;
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotationMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotationMatrix');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');

  if (a_Position < 0 || !u_ModelMatrix || !u_GlobalRotationMatrix || !u_FragColor) {
    console.log('Failed to get shader variable locations');
    return;
  }

  cube = initCubeBuffers(gl);
  if (!cube) {
    return;
  }

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  addActionsForHtmlUI();
  tick();
}

function addActionsForHtmlUI() {
    document.getElementById('angleSlide').addEventListener('input', function(){
      gAnimalGlobalRotation = Number(this.value);
      renderScene();
    });
    document.getElementById('frontLegSlide').addEventListener('input', function() {
      gFrontLegManual = Number(this.value);
      renderScene();
    });

    document.getElementById('backLegSlide').addEventListener('input', function() {
      gBackLegManual = Number(this.value);
      renderScene();
    });

    document.getElementById('earSlide').addEventListener('input', function() {
      gEarManual = Number(this.value);
      renderScene();
    });
    document.getElementById('tail1Slide').addEventListener('input', function() {
      gTail1Angle = Number(this.value);
      renderScene();
    });
    document.getElementById('tail2Slide').addEventListener('input', function() {
      gTail2Angle = Number(this.value);
      renderScene();
    });
    document.getElementById('tail3Slide').addEventListener('input', function() {
      gTail3Angle = Number(this.value);
      renderScene();
    });

    document.getElementById('animationOnButton').onclick = function() {
      gAnimation = true;
    };
    document.getElementById('animationOffButton').onclick = function() {
      gAnimation = false;
    };
    document.getElementById('zoomSlide').addEventListener('input', function() {
      gZoom = Number(this.value) / 100;
      renderScene();
    });
    canvas.onmousemove = function(ev) {
      var rect = canvas.getBoundingClientRect();

      var x = ev.clientX - rect.left;
      var y = ev.clientY - rect.top;

      gMouseRotY = -(x / canvas.width - 0.5) * 180;
      gMouseRotX = -(y / canvas.height - 0.5) * 180;

      renderScene();
    };
    canvas.onclick = function(ev) {
      if (ev.shiftKey) {
        gPoke = true;
        gWink = true;
        gPokeStart = g_seconds;
      }
    };
}

function drawCube(modelMatrix, color) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

  gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);
  gl.drawElements(gl.TRIANGLES, cube.numIndices, gl.UNSIGNED_BYTE, 0);
}

function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var globalRotMat = new Matrix4();
  globalRotMat.scale(gZoom, gZoom, gZoom);
  globalRotMat.rotate(gAnimalGlobalRotation, 0, 1, 0);
  globalRotMat.rotate(gMouseRotY, 0, 1, 0);
  globalRotMat.rotate(gMouseRotX, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotationMatrix, false, globalRotMat.elements);

   // Body
  var body = new Matrix4();
  body.translate(0.15, 0.0, 0.0);
  body.scale(0.55, 0.28, 0.30);
  drawCube(body, [0.33, 0.32, 0.32, 1.0]);

  // Head
  var head = new Matrix4();
  head.translate(-0.45, 0.02, 0.0);
  head.scale(0.30, 0.23, 0.25);
  drawCube(head, [0.32, 0.32, 0.32, 1.0]);

  // Snout
  var snout = new Matrix4();
  snout.translate(-0.75, -0.03, 0.0);
  snout.scale(0.16, 0.10, 0.14);
  drawCube(snout, [0.32, 0.32, 0.32, 1.0]);

  // Nose
  var noseMatrix = new Matrix4();
  noseMatrix.translate(-0.81 + gNoseWiggle, 0.01, 0.0);
  noseMatrix.scale(.7, 0.7, 1.0);

  drawTriPyramid(noseMatrix, [0.95, 0.45, 0.50, 1.0]);

  // Eyes
  var eye1 = new Matrix4();
  eye1.translate(-0.75, 0.08, -0.18);
  eye1.scale(0.02, 0.03 * gBlink, 0.04);
  drawCube(eye1, [0, 0, 0, 1.0]);

  var eye2 = new Matrix4();
  eye2.translate(-0.75, 0.08, 0.18);
  // if wink → flatten eye
  if (gWink) {
    eye2.scale(0.02, 0.005, 0.04);
  } else {
    eye2.scale(0.02, 0.03, 0.04);
  }
  drawCube(eye2, [0, 0, 0, 1.0]);

  // Ears
  var earL = new Matrix4();
  earL.translate(-0.45, 0.28, 0.18);
  earL.rotate(gEarAngle + gEarManual, 0, 0, 1);
  earL.scale(0.08, 0.13, 0.04);
  drawCube(earL, [0.95, 0.50, 0.55, 1.0]);

  var earR = new Matrix4();
  earR.translate(-0.45, 0.28, -0.18);
  earR.rotate(-gEarAngle - gEarManual, 0, 0, 1);
  earR.scale(0.08, 0.13, 0.04);
  drawCube(earR, [0.95, 0.50, 0.55, 1.0]);

  // Teeth
  var toothL = new Matrix4();
  toothL.translate(-0.80, -0.17, 0.04);
  toothL.scale(0.04, 0.10, 0.035);
  drawCube(toothL, [1.0, 1.0, 0.9, 1.0]);

  var toothR = new Matrix4();
  toothR.translate(-0.80, -0.17, -0.04);
  toothR.scale(0.04, 0.10, 0.035);
  drawCube(toothR, [1.0, 1.0, 0.9, 1.0]);

  // Legs
    // Front left upper leg
  var frontUpperLegL = new Matrix4();
  frontUpperLegL.translate(-0.18, -0.28, 0.15);
  frontUpperLegL.rotate(-20 + gFrontLegAngle + gFrontLegManual, 0, 0, 1);
  frontUpperLegL.scale(0.06, 0.10, 0.06);
  drawCube(frontUpperLegL, [0.30, 0.30, 0.30, 1.0]);

    // Front left lower leg
  var frontLowerLegL = new Matrix4(frontUpperLegL);
  frontLowerLegL.translate(0.0, -1.1, 0.0);
  frontLowerLegL.rotate(-10, 0, 0, 1);
  drawCube(frontLowerLegL, [0.28, 0.28, 0.28, 1.0]);

    // Front left foot 
  var frontFootL = new Matrix4(frontUpperLegL);
  frontFootL.translate(-0.6, -1.9, 0.0);
  frontFootL.scale(1.8, 0.4, 1.2);
  drawCube(frontFootL, [0.76, 0.51, 0.48, 1.0]); 

  // Back left upper leg
  var backUpperLegL = new Matrix4();
  backUpperLegL.translate(0.42, -0.28, 0.15);
  backUpperLegL.rotate(15 + gFrontLegAngle + gBackLegManual, 0, 0, 1);
  backUpperLegL.scale(0.07, 0.10, 0.06);
  drawCube(backUpperLegL, [0.30, 0.30, 0.30, 1.0]);

  // Back left lower leg
  var backLowerLegL = new Matrix4(backUpperLegL);
  backLowerLegL.translate(0.0, -1.1, 0.0);
  backLowerLegL.rotate(10, 0, 0, 1);
  drawCube(backLowerLegL, [0.28, 0.28, 0.28, 1.0]);

  // Back left foot
  var backFootL = new Matrix4(backUpperLegL);
  backFootL.translate(-0.5, -2.0, 0.0);
  backFootL.scale(1.8, 0.4, 1.2);
  drawCube(backFootL, [0.76, 0.51, 0.48, 1.0]);

  // Front right upper leg
  var frontUpperLegR = new Matrix4();
  frontUpperLegR.translate(-0.18, -0.28, -0.15);
  frontUpperLegR.rotate(-20 + gBackLegAngle + gFrontLegManual, 0,  0, 1);
  frontUpperLegR.scale(0.06, 0.10, 0.06);
  drawCube(frontUpperLegR, [0.25, 0.25, 0.25, 1.0]);

  // Front right lower leg
  var frontLowerLegR = new Matrix4(frontUpperLegR);
  frontLowerLegR.translate(0.0, -1.1, 0.0);
  frontLowerLegR.rotate(-10, 0, 0, 1);
  drawCube(frontLowerLegR, [0.23, 0.23, 0.23, 1.0]);

  // Front right foot
  var frontFootR = new Matrix4(frontUpperLegR);
  frontFootR.translate(-0.5, -2.0, 0.0);
  frontFootR.scale(1.8, 0.4, 1.2);
  drawCube(frontFootR, [0.76, 0.51, 0.48, 1.0]);

  // Back right upper leg
  var backUpperLegR = new Matrix4();
  backUpperLegR.translate(0.42, -0.28, -0.15);
  backUpperLegR.rotate(15 + gBackLegAngle + gBackLegManual, 0, 0, 1);
  backUpperLegR.scale(0.07, 0.10, 0.06);
  drawCube(backUpperLegR, [0.25, 0.25, 0.25, 1.0]);

  // Back right lower leg
  var backLowerLegR = new Matrix4(backUpperLegR);
  backLowerLegR.translate(0.0, -1.1, 0.0);
  backLowerLegR.rotate(10, 0, 0, 1);
  drawCube(backLowerLegR, [0.23, 0.23, 0.23, 1.0]);

  // Back right foot
  var backFootR = new Matrix4(backUpperLegR);
  backFootR.translate(-0.6, -2.0, 0.0);
  backFootR.scale(1.8, 0.4, 1.2);
  drawCube(backFootR, [0.76, 0.51, 0.48, 1.0]);

  // Tail, 3 segments for joint chain 
  var tailBase = new Matrix4();
  tailBase.translate(0.70, 0.03, 0.0);
  tailBase.rotate(gTail1Angle, 0, 0, 1);

  // Tail segment 1
  var tail1 = new Matrix4(tailBase);
  tail1.translate(0.12, 0.0, 0.0);
  tail1.scale(0.18, 0.04, 0.04);
  drawCube(tail1, [0.95, 0.45, 0.50, 1.0]);

  // Joint after tail segment 1
  var tailJoint2 = new Matrix4(tailBase);
  tailJoint2.translate(0.30, 0.0, 0.0);
  tailJoint2.rotate(gTail2Angle, 0, 0, 1);

  // Tail segment 2
  var tail2 = new Matrix4(tailJoint2);
  tail2.translate(0.12, 0.0, 0.0);
  tail2.scale(0.18, 0.04, 0.04);
  drawCube(tail2, [0.90, 0.4, 0.45, 1.0]);

  // Joint after tail segment 2
  var tailJoint3 = new Matrix4(tailJoint2);
  tailJoint3.translate(0.30, 0.0, 0.0);
  tailJoint3.rotate(gTail3Angle, 0, 0, 1);

  // Tail segment 3
  var tail3 = new Matrix4(tailJoint3);
  tail3.translate(0.10, 0.0, 0.0);
  tail3.scale(0.16, 0.035, 0.035);
  drawCube(tail3, [0.85, 0.39, 0.40, 1.0]);

  //drawCube(modelMatrix, [0.52, 0.41, 0.55, 1.0]);
}

function updateAnimationAngles() {
  if (gAnimation) {
    gTail1Angle = 25 + 20 * Math.sin(g_seconds * 2);
    gTail2Angle = 10 + 15 * Math.sin(g_seconds * 2 + 1);
    gTail3Angle = -10 + 10 * Math.sin(g_seconds * 2 + 2);

    gFrontLegAngle = 10 * Math.sin(g_seconds * 3);
    gBackLegAngle = -gFrontLegAngle;

    if (Math.floor(g_seconds) % 4 === 0) {
      gEarAngle = 6 * Math.sin(g_seconds * 10);
    } else {
      gEarAngle = 0;
    }

    gNoseWiggle = 0.003 * Math.sin(g_seconds * 6);
  }

  if (gPoke) {
    var t = g_seconds - gPokeStart;

    if (t < 0.8) {
      gEarAngle = 20 * Math.sin(g_seconds * 30);
      gTail1Angle = 45 * Math.sin(g_seconds * 25);
      gTail2Angle = 20 * Math.sin(g_seconds * 25);
      gWink = true;
    } else {
      gPoke = false;
      gWink = false;
    }
  }
}

function tick() {
  var now = performance.now();
  var delta = now - g_lastTime;

  g_fps = 1000 / delta;
  g_lastTime = now;

  g_seconds = now / 1000.0 - g_startTime;

  updateAnimationAngles();
  renderScene();

  // display FPS
  document.getElementById("fps").innerText = "FPS: " + g_fps.toFixed(1);

  requestAnimationFrame(tick);
}

function drawTriPyramid(modelMatrix, color) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

  var vertices = new Float32Array([
    // front face
    -0.10,  0.08, -0.08,
    -0.10,  0.08,  0.08,
    -0.10, -0.08,  0.00,

    // top face
    -0.10,  0.08, -0.08,
    -0.10,  0.08,  0.08,
    -0.22,  0.00,  0.00,

    // left face
    -0.10,  0.08, -0.08,
    -0.10, -0.08,  0.00,
    -0.22,  0.00,  0.00,

    // right face
    -0.10,  0.08,  0.08,
    -0.10, -0.08,  0.00,
    -0.22,  0.00,  0.00
  ]);

  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, 12);
}
