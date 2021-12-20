"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VertexBuffer = void 0;
class VertexBuffer {
    constructor(gl, data) {
        this.size = 0;
        this.gl = gl;
        this.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        this.vao = gl.createVertexArray();
    }
    attribute(location, size, offset, stride) {
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
exports.VertexBuffer = VertexBuffer;
