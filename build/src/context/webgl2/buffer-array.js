"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferArray = void 0;
class BufferArray {
    constructor(gl) {
        this.size = 0;
        this.gl = gl;
        this.vao = gl.createVertexArray();
    }
    add(location, buffer, size, offset, stride, divisor = 0, type = -1) {
        if (location == -1)
            return;
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
exports.BufferArray = BufferArray;
