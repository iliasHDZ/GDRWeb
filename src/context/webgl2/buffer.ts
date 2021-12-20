export class VertexBuffer {
    gl: WebGL2RenderingContext;

    vbo: WebGLBuffer;
    vao: WebGLVertexArrayObject;

    public size = 0;

    constructor(gl: WebGL2RenderingContext, data: number[]) {
        this.gl = gl;

        this.vbo = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

        this.vao = gl.createVertexArray();
    }

    attribute(location: number, size: number, offset: number, stride: number) {
        let gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bindVertexArray(this.vao);

        gl.enableVertexAttribArray(location);

        gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset);
    }

    use() {
        let gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bindVertexArray(this.vao);
    }
}