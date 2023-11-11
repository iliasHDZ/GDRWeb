"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShaderProgram = void 0;
class ShaderProgram {
    constructor(gl) {
        this.shaders = [];
        this.attribs = {};
        this.uniforms = {};
        this.gl = gl;
    }
    loadShader(type, source) {
        let gl = this.gl;
        let s = gl.createShader(type);
        gl.shaderSource(s, source);
        gl.compileShader(s);
        if (gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            this.shaders.push(s);
            return;
        }
        let e = new Error(gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        throw e;
    }
    link() {
        let gl = this.gl;
        let prog = gl.createProgram();
        for (let s of this.shaders)
            gl.attachShader(prog, s);
        gl.linkProgram(prog);
        if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            this.program = prog;
            return;
        }
        let e = new Error(gl.getProgramInfoLog(prog));
        gl.deleteProgram(prog);
        throw e;
    }
    attrib(name) {
        if (this.attribs[name])
            return this.attribs[name];
        let l = this.gl.getAttribLocation(this.program, name);
        this.attribs[name] = l;
        return l;
    }
    uniform(name) {
        if (this.uniforms[name])
            return this.uniforms[name];
        let l = this.gl.getUniformLocation(this.program, name);
        this.uniforms[name] = l;
        return l;
    }
    uMat3(name, m) {
        this.gl.uniformMatrix3fv(this.uniform(name), false, new Float32Array(m.buffer()));
    }
    uVec2(name, v) {
        this.gl.uniform2fv(this.uniform(name), new Float32Array(v.buffer()));
    }
    uColor(name, v) {
        this.gl.uniform4fv(this.uniform(name), new Float32Array([v.r, v.g, v.b, v.a]));
    }
    uInteger(name, i) {
        this.gl.uniform1i(this.uniform(name), i);
    }
    uV4(name, buffer) {
        this.gl.uniform4fv(this.uniform(name), buffer);
    }
    uV1(name, buffer) {
        this.gl.uniform1fv(this.uniform(name), buffer);
    }
    use() {
        this.gl.useProgram(this.program);
    }
}
exports.ShaderProgram = ShaderProgram;
