// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_Size;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = u_Size;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +  // uniform変数
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

  let canvas;
  let gl;
  let a_Position;
  let u_FragColor;
  let u_Size;

  var g_selectedColor = [1.0, 1.0, 1.0, 1.0];
  var g_selectedSize= 10.0;
  var g_selectedType = "point";
  var g_selectedSegment = 10;
  var g_selectedAlpha = 1.0;

  var g_shapeList = [];
  
  //var g_points = [];  // The array for the position of a mouse press
  //var g_colors = [];  // The array to store the color of a point
  //var g_sizes= [];
  
  
  function main() {
      setupWebGL();
      connectVariablesToGLSL();

      //enable transperenncy
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      // Register function (event handler) to be called on a mouse press
      canvas.onmousedown = click;

      canvas.onmousemove = function(ev) {
        if (ev.buttons == 1) {
            click(ev);
        }
      };

      document.getElementById('clearBtn').onclick = function() {
        g_shapeList = [];
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        renderAllShapes();
      };
      document.getElementById('undoBtn').onclick = function() {
        g_shapeList.pop();
        renderAllShapes();
      };

      document.getElementById('SquareBtn').onclick = function() {
        g_selectedType = "point";
      };
      document.getElementById('TriangleBtn').onclick = function() {
        g_selectedType = "triangle";
      };
      document.getElementById('CircleBtn').onclick = function() {
        g_selectedType = "circle";
      };

      document.getElementById('redSlide').addEventListener('input', function() {
        g_selectedColor[0] = this.value / 100;
      });
      document.getElementById('greenSlide').addEventListener('input', function() {
        g_selectedColor[1] = this.value / 100;
      });
      document.getElementById('blueSlide').addEventListener('input', function() {
        g_selectedColor[2] = this.value / 100;
      });
      document.getElementById('sizeSlide').addEventListener('input', function() {
        g_selectedSize = this.value;
      });
      document.getElementById('segSlide').addEventListener('input', function() {
        g_selectedSegment = this.value;
      });
      document.getElementById('alphaSlide').addEventListener('input', function() {
        g_selectedAlpha = this.value / 100;
      });
      document.getElementById('carBtn').onclick = function() {
        drawCat();
      };
      
      g_selectedColor[0] = document.getElementById('redSlide').value /100;
      g_selectedColor[1] = document.getElementById('greenSlide').value /100;
      g_selectedColor[2] = document.getElementById('blueSlide').value /100;
      g_selectedSize = document.getElementById('sizeSlide').value;
      g_selectedSegment = document.getElementById('segSlide').value;
      g_selectedAlpha = document.getElementById('alphaSlide').value/100;

      // Specify the color for clearing <canvas>
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      
      // Clear <canvas>
      gl.clear(gl.COLOR_BUFFER_BIT);

}

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');
  
    // Get the rendering context for WebGL
    gl = getWebGLContext(canvas);

    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }

}

function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
      console.log('Failed to intialize shaders.');
      return;
    }
    
    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return;
    }
    
    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
      console.log('Failed to get the storage location of u_FragColor');
      return;
    }

    u_Size = gl.getUniformLocation(gl.program, "u_Size");
    if (!u_Size) {
        console.log("Failed to get the storage location of u_Size");
        return;
    }
    
}

function click(ev) {
    let [x, y] = convertCoordEventToGL(ev);

    let shape;

    if (g_selectedType == "point") {
        shape = new Square();
    } else if (g_selectedType == "triangle") {
        shape = new Triangle();
    } else if (g_selectedType == "circle") {
        shape = new Circle();
        shape.segments = g_selectedSegment;
    }
     
    //var point = new Point();
    shape.position = [x, y];
    shape.color = [g_selectedColor[0], g_selectedColor[1], g_selectedColor[2], g_selectedAlpha];
    shape.size = g_selectedSize;

    g_shapeList.push(shape);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Store the coordinates to g_points array
    //g_points.push([x, y]);
    //g_colors.push([g_selectedColor[0], g_selectedColor[1], g_selectedColor[2], 1.0]);
    //g_sizes.push(g_selectedSize);
    
    // Store the coordinates to g_points array
    /*if (x >= 0.0 && y >= 0.0) {      // First quadrant
        g_colors.push([1.0, 0.0, 0.0, 1.0]);  // Red
    } else if (x < 0.0 && y < 0.0) { // Third quadrant
        g_colors.push([0.0, 1.0, 0.0, 1.0]);  // Green
    } else {                         // Others
        g_colors.push([1.0, 1.0, 1.0, 1.0]);  // White
    }*/

    renderAllShapes();
    
}

function convertCoordEventToGL(ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
    
    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    return [x, y];
}

function renderAllShapes() {
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    var len = g_shapeList.length;
    for (var i = 0; i < len; i++) {
        g_shapeList[i].render();
    }
    /*var len = g_points.length;
    for(var i = 0; i < len; i++) {
      var xy = g_points[i];
      var rgba = g_colors[i];
      var size = g_sizes[i];
    
      // Pass the position of a point to a_Position variable
      gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
      // Pass the color of a point to u_FragColor variable
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.uniform1f(u_Size, size);
      // Draw
      gl.drawArrays(gl.POINTS, 0, 1);
    }*/
}

class Square {
    constructor() {
        this.position = [0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.size = 10.0;
    }
    render() {
        var xy = this.position;
        var rgba = this.color;
        var size = this.size;

        gl.disableVertexAttribArray(a_Position); //disable vertex attribute array
        gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniform1f(u_Size, size * 2.0);
        gl.drawArrays(gl.POINTS, 0, 1);
    }
}

function drawTriangle(vertices) {

    var n = 3; // The number of vertices

    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);

    // Draw the rectangle
     gl.drawArrays(gl.TRIANGLES, 0, n);
};

class Triangle {
    constructor() {
        this.position = [0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.size = 10.0;
    }
    render() {
        var xy = this.position;
        var rgba = this.color;
        var size = this.size;

        var d = size / 200.0;

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        drawTriangle([
            xy[0], xy[1] + d, 
            xy[0] - d, xy[1] - d, 
            xy[0] + d, xy[1] - d
        ]);
    }
}

class Circle {
    constructor() {
        this.position = [0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.size = 10.0;
        this.segments = 10;
    }
    render() {
        var xy = this.position;
        var rgba = this.color;
        var size = this.size;
        var segments = this.segments;

        var d = size / 200;

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        
        let anglestep = 360/segments;
        for(let angle = 0; angle < 360; angle += anglestep){
            let angle1 = angle * Math.PI / 180;
            let angle2 = (angle + anglestep) * Math.PI / 180;
            let x1 = xy[0] + Math.cos(angle1) * d;
            let y1 = xy[1] + Math.sin(angle1) * d;
            let x2 = xy[0] + Math.cos(angle2) * d;
            let y2 = xy[1] + Math.sin(angle2) * d;

            drawTriangle([
                xy[0], xy[1], 
                x1, y1,
                x2, y2
            ]);
        }
    }
}

function drawCat() {
    gl.clearColor(0.6, 0.75, 0.45, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //head
    gl.uniform4f(u_FragColor, 0.98, 0.6, 0.15, 1.0);
    drawTriangle([-0.45, -0.3, 0.45, -0.3, 0.45, 0.35]);
    drawTriangle([-0.45, -0.3, -0.45, 0.35, 0.45, 0.35]);

    //left ear
    //gl.uniform4f(u_FragColor, 0.7, 0.7, 0.7, 1.0);
    gl.uniform4f(u_FragColor, 0.98, 0.6, 0.15, 1.0);
    drawTriangle([-0.45, 0.35, -0.25, 0.7, -0.05, 0.35]);
    gl.uniform4f(u_FragColor, 0.9, 0.7, 0.7, 1.0);
    drawTriangle([-0.40, 0.36, -0.27, 0.62, -0.14, 0.36]);

    //right ear
    gl.uniform4f(u_FragColor, 0.98, 0.6, 0.15, 1.0);
    drawTriangle([0.05, 0.35, 0.25, 0.7, 0.45, 0.35]);
    gl.uniform4f(u_FragColor, 0.9, 0.7, 0.7, 1.0);
    drawTriangle([0.10, 0.36, 0.23, 0.62, 0.36, 0.36]);  
    //eyes
    gl.uniform4f(u_FragColor, 0.0, 0.0, 0.0, 1.0);
    drawTriangle([-0.24, 0.05, -0.12, 0.05, -0.12, 0.17]);
    drawTriangle([-0.24, 0.05, -0.24, 0.17, -0.12, 0.17]);
    drawTriangle([0.12, 0.05, 0.24, 0.05, 0.24, 0.17]);
    drawTriangle([0.12, 0.05, 0.12, 0.17, 0.24, 0.17]);

    //nose
    gl.uniform4f(u_FragColor, 5.7, 0.7, 0.7, 1.0);
    drawTriangle([-0.04, -0.02, 0.04, -0.02, 0.0, -0.12]);

    //mouth
    gl.uniform4f(u_FragColor, 0.0, 0.0, 0.0, 1.0);
    drawTriangle([-0.01, -0.12, -0.09, -0.22, 0.0, -0.12]);
    drawTriangle([0.01, -0.12, 0.09, -0.22, 0.0, -0.12]);

    //wisker
    gl.uniform4f(u_FragColor, 0.82, 0.82, 0.82, 1.0);
    drawTriangle([-0.05, -0.1, -0.5, -0.05, -0.5, -0.07]);
    drawTriangle([-0.05, -0.15, -0.5, -0.15, -0.5, -0.17]);
    drawTriangle([0.05, -0.1, 0.5, -0.05, 0.5, -0.07]);
    drawTriangle([0.05, -0.15, 0.5, -0.15, 0.5, -0.17]);

    //collar
    gl.uniform4f(u_FragColor, 0.2, 0.4, 0.8, 1.0);
    drawTriangle([-0.30, -0.27, 0.30, -0.27, 0.30, -0.34]);
    drawTriangle([-0.30, -0.27, -0.30, -0.34, 0.30, -0.34]);

    //iniials AA
    gl.uniform4f(u_FragColor, 1.0, 1.0, 2.0, 1.0);
    //left A
    drawTriangle([-0.07, -0.34, -0.06, -0.275, -0.06, -0.34]);
    drawTriangle([-0.05, -0.34, -0.06, -0.275, -0.04, -0.34]);
    drawTriangle([-0.065, -0.325, -0.045, -0.325, -0.055, -0.31]);

    //right A
    drawTriangle([-0.035, -0.34, -0.025, -0.275, -0.025, -0.34]);
    drawTriangle([-0.015, -0.34, -0.025, -0.275, -0.005, -0.34]);
    drawTriangle([-0.03, -0.325, -0.01, -0.325, -0.02, -0.31]);
}
