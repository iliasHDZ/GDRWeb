"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferObject = void 0;
class BufferObject {
    constructor(gl, data) {
        this.size = 0;
        this.gl = gl;
        this.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    }
}
exports.BufferObject = BufferObject;
