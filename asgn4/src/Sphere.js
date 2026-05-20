export default class Sphere {
    constructor() {
        this.matrix = new Matrix4();

        this.vertices = [];
        this.normals = [];
        this.indices = [];
    }

    init(gl) {
        const SPHERE_DIV = 20;

        for (let j=0; j<=SPHERE_DIV; j++) {
            let aj = j*Math.PI/SPHERE_DIV;
            let sj = Math.sin(aj);
            let cj = Math.cos(aj);

            for (let i=0; i<=SPHERE_DIV; i++) {
                let ai = i*2*Math.PI/SPHERE_DIV;
                let si = Math.sin(ai);
                let ci = Math.cos(ai);

                let x = si*sj;
                let y = cj;
                let z = ci*sj;

                this.vertices.push(x,y,z);

                // Normal = Position
                this.normals.push(x,y,z);
            }
        }

        for(let j=0;j<SPHERE_DIV;j++){
            for(let i=0;i<SPHERE_DIV;i++){

                let p1=j*(SPHERE_DIV+1)+i;
                let p2=p1+(SPHERE_DIV+1);

                this.indices.push(p1,p2,p1+1);

                this.indices.push(
                    p1+1,
                    p2,
                    p2+1
                );
            }
        }

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,this.vertexBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(this.vertices),
            gl.STATIC_DRAW
        );

        this.normalBuffer=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,this.normalBuffer);

        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(this.normals),
            gl.STATIC_DRAW
        );

        this.indexBuffer=gl.createBuffer();

        gl.bindBuffer(
            gl.ELEMENT_ARRAY_BUFFER,
            this.indexBuffer
        );

        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(this.indices),
            gl.STATIC_DRAW
        );
    }

    render(gl, program) {
        if (!this.vertexBuffer) {
            this.init(gl);
        }

        gl.uniformMatrix4fv(
            program.u_ModelMatrix,
            false,
            this.matrix.elements
        );

        let normalMatrix = new Matrix4();
        normalMatrix.setInverseOf(this.matrix);
        normalMatrix.transpose();

        gl.uniformMatrix4fv(
            program.u_NormalMatrix,
            false,
            normalMatrix.elements
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(program.a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program.a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(program.a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program.a_Normal);

        if (program.uv >= 0) {
            gl.disableVertexAttribArray(program.uv);
            gl.vertexAttrib2f(program.uv, 0, 0);
        }

        if (program.a_Offset >= 0) {
            gl.disableVertexAttribArray(program.a_Offset);
            gl.vertexAttrib3f(program.a_Offset, 0, 0, 0);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        gl.drawElements(
            gl.TRIANGLES,
            this.indices.length,
            gl.UNSIGNED_SHORT,
            0
        );
    }
}