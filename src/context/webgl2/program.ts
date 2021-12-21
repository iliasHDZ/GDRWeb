import { Mat3 } from "../../util/mat3";

export class ShaderProgram {
    gl: WebGL2RenderingContext;

    shaders: WebGLShader[] = [];
    program: WebGLProgram;

    attribs  = {};
    uniforms = {};

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
    }

    loadShader(type: number, source: string) {
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

    attrib(name: string) {
        if (this.attribs[name])
            return this.attribs[name];

        let l = this.gl.getAttribLocation(this.program, name);
        this.attribs[name] = l;

        return l;
    }

    uniform(name: string) {
        if (this.uniforms[name])
            return this.uniforms[name];

        let l = this.gl.getUniformLocation(this.program, name);
        this.uniforms[name] = l;

        return l;
    }

    uMat3(name: string, m: Mat3) {
        this.gl.uniformMatrix3fv(this.uniform(name), false, new Float32Array(m.buffer()));
    }

    uInteger(name: string, i: number) {
        this.gl.uniform1i(this.uniform(name), i);
    }

    use() {
        this.gl.useProgram(this.program);
    }
}