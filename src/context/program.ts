import { Color } from "../util/color";
import { Mat3 } from "../util/mat3";
import { Vec2 } from "../util/vec2";

export class ShaderProgram {
    gl: WebGL2RenderingContext;

    shaders: WebGLShader[] = [];
    program?: WebGLProgram;

    attribs: { [name: string]: number }  = {};
    uniforms: { [name: string]: WebGLUniformLocation } = {};

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
    }

    loadShader(type: number, source: string) {
        let gl = this.gl;
        let shader = gl.createShader(type);
        if (!shader)
            throw new Error("failed to create shader");

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            this.shaders.push(shader);
            return;
        }

        let e = new Error(gl.getShaderInfoLog(shader) ?? "null");
        gl.deleteShader(shader);

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

        let e = new Error(gl.getProgramInfoLog(prog) ?? "null");
        gl.deleteProgram(prog);

        throw e;
    }

    attrib(name: string): number {
        if (!this.program)
            return 0;

        if (this.attribs[name])
            return this.attribs[name];

        const location = this.gl.getAttribLocation(this.program, name);
        this.attribs[name] = location;

        return location;
    }

    uniform(name: string): WebGLUniformLocation {
        if (!this.program)
            return 0;

        if (this.uniforms[name])
            return this.uniforms[name];

        const location = this.gl.getUniformLocation(this.program, name) ?? 0;
        this.uniforms[name] = location;

        return location;
    }

    uMat3(name: string, m: Mat3) {
        try {
            this.gl.uniformMatrix3fv(this.uniform(name), false, new Float32Array(m.buffer()));
        } catch {}
    }

    uVec2(name: string, v: Vec2) {
        try {
            this.gl.uniform2fv(this.uniform(name), new Float32Array(v.buffer()));
        } catch {}
    }

    uColor(name: string, v: Color) {
        try {
            this.gl.uniform4fv(this.uniform(name), new Float32Array([v.r, v.g, v.b, v.a]));
        } catch {}
    }

    uInteger(name: string, i: number) {
        try {
            this.gl.uniform1i(this.uniform(name), i);
        } catch {}
    }

    uFloat(name: string, v: number) {
        try {
            this.gl.uniform1f(this.uniform(name), v);
        } catch {}
    }

    uV4(name: string, buffer: number[]) {
        try {
            this.gl.uniform4fv(this.uniform(name), buffer);
        } catch {}
    }

    uV1(name: string, buffer: number[]) {
        try {
            this.gl.uniform1fv(this.uniform(name), buffer);
        } catch {}
    }

    use() {
        if (this.program)
            this.gl.useProgram(this.program);
    }
}