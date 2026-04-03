// DrawRectangle.js
function main() {
    //retrieve <canvas> element
    var canvas = document.getElementById('example');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    //Get the rendering context for the 2DCG
    var ctx = canvas.getContext('2d');
    
    //draw a blue rectangle
    ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; //set black color
    ctx.fillRect(0, 0, canvas.width, canvas.height); // fill a rectangle with the color

    //instantiate vector v1 using Vector3 class
    var v1 = new Vector3([2.25, 2.25, 0]); //usign typed arrays for numerical vectors
    
    //draw vector
    drawVector(v1, "red");
}

// takes a Vector3 v and a string color to draw a vector
function drawVector(v, color) {
    var canvas = document.getElementById("example");
    var ctx = canvas.getContext('2d');

    ctx.strokeStyle = color; //set stroke color to red
    var originX = 200;
    var originY = 200;
    var x = v.elements[0] * 20;
    var y = v.elements[1] * 20;

    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX + x, originY - y);
    ctx.stroke();
}

function handleDrawEvent(){
    var canvas = document.getElementById("example");
    var ctx = canvas.getContext('2d');
    //clear canvas
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //read vals to create v1
    var x1 = parseFloat(document.getElementById("v1x").value);
    var y1 = parseFloat(document.getElementById("v1y").value);
    var v1 = new Vector3([x1, y1, 0]);

    //read vals to create v2
    var x2 = parseFloat(document.getElementById("v2x").value);
    var y2 = parseFloat(document.getElementById("v2y").value);
    var v2 = new Vector3([x2, y2, 0]);

    //call drawVector(v1, red) and v2
    drawVector(v1, "red");
    drawVector(v2, "blue");

}
//second draw btn
function handleDrawOperationEvent(){
    var canvas = document.getElementById("example");
    var ctx = canvas.getContext('2d');
    //clear canvas
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //read vals to create v1
    var x1 = parseFloat(document.getElementById("v1x").value);
    var y1 = parseFloat(document.getElementById("v1y").value);
    var v1 = new Vector3([x1, y1, 0]);

    //read vals to create v2
    var x2 = parseFloat(document.getElementById("v2x").value);
    var y2 = parseFloat(document.getElementById("v2y").value);
    var v2 = new Vector3([x2, y2, 0]);

    //call drawVector(v1, red) and v2
    drawVector(v1, "red");
    drawVector(v2, "blue");

    //read operation & scalar
    var op = document.getElementById("select").value;
    var s = parseFloat(document.getElementById("scalar").value);
    
    if (op === "add"){
        var v3 = new Vector3([x1, y1, 0]);
        v3.add(v2);
        drawVector(v3, "green");
    }

    if (op === "sub"){
        var v3 = new Vector3([x1, y1, 0]);
        v3.sub(v2);
        drawVector(v3, "green");
    }
    
    if (op === "mul"){
        var v3 = new Vector3([x1, y1, 0]);
        var v4 = new Vector3([x2, y2, 0]);
        v3.mul(s);
        v4.mul(s);
        drawVector(v3, "green");
        drawVector(v4, "green");
    }

    if (op === "div"){
        var v3 = new Vector3([x1, y1, 0]);
        var v4 = new Vector3([x2, y2, 0]);
        v3.div(s);
        v4.div(s);
        drawVector(v3, "green");
        drawVector(v4, "green");
    }

    if (op === "magnitude") {
        console.log("Magnitude v1:", v1.magnitude());
        console.log("Magnitude v2:", v2.magnitude());
        
    }

    if (op === "normalize") {
        var v3 = new Vector3([x1, y1, 0]);
        var v4 = new Vector3([x2, y2, 0]);
        v3.normalize();
        v4.normalize();
        drawVector(v3, "green");
        drawVector(v4, "green");
    }

    if (op === "angle") {
        console.log("Angle: ", angleBetween(v1, v2));
    }

    if (op === "area"){
        console.log("Area of the triangle: ", areaTriangle(v1, v2));
    }
}

//dot(v1, v2) = ||v1|| * ||v2|| * cos(alpha).
//cos(alpha) = (a * b)/(||v1|| * ||v2||)
function angleBetween(v1, v2){
    let dot = Vector3.dot(v1, v2);
    let mag1 = v1.magnitude();
    let mag2 = v2.magnitude();

    let cosA = dot / (mag1 * mag2);

    //if(cosA > 1) cosA = 1; 
    //if(cosA < -1) cosA = -1; 

    let angleRad = Math.acos(cosA); //if not between -1 & 1, returns NaN
    let angleDegree = angleRad * (180 / Math.PI);

    return angleDegree;
}

function areaTriangle(v1, v2){
    let cross = Vector3.cross(v1, v2);
    let areaParalelgram = cross.magnitude();
    let areaTriangle = areaParalelgram / 2;

    return areaTriangle;
}
//alt+dwn to move line