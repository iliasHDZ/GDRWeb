import { Color } from "../../util/color";
import { Mat3 } from "../../util/mat3";
import { Vec2 } from "../../util/vec2";
export declare class ShaderProgram {
    gl: WebGL2RenderingContext;
    shaders: WebGLShader[];
    program: WebGLProgram;
    attribs: {};
    uniforms: {};
    constructor(gl: WebGL2RenderingContext);
    loadShader(type: number, source: string): void;
    link(): void;
    attrib(name: string): any;
    uniform(name: string): any;
    uMat3(name: string, m: Mat3): void;
    uVec2(name: string, v: Vec2): void;
    uColor(name: string, v: Color): void;
    uInteger(name: string, i: number): void;
    uV4(name: string, buffer: number[]): void;
    uV1(name: string, buffer: number[]): void;
    use(): void;
}
