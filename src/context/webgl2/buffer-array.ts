import { BufferObject } from './buffer';

export class BufferArray {
    gl: WebGL2RenderingContext;

    vao: WebGLVertexArrayObject;

    public size = 0;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;

        this.vao = gl.createVertexArray();
    }

    add(location: number, buffer: BufferObject, size: number, offset: number, stride: number, divisor: number = 0, type: number = -1) {
        if (location == -1) return;

        let gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vbo);
        gl.bindVertexArray(this.vao);

        gl.enableVertexAttribArray(location);

        gl.vertexAttribPointer(location, size, type == -1 ? gl.FLOAT : type, false, stride, offset);

        if (divisor != 0)
            gl.vertexAttribDivisor(location, divisor);
    }

    use() {
        let gl = this.gl;

        gl.bindVertexArray(this.vao);
    }
}