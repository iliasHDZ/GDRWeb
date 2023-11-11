import { Vec2 } from './vec2';
export declare class Mat3 {
    d: Float32Array;
    constructor();
    static from(m: Mat3): Mat3;
    translate(v: Vec2): void;
    scale(v: Vec2): void;
    rotate(r: number): void;
    transform(v: Vec2): Vec2;
    static multiplyMatrices(...matrices: Mat3[]): Mat3;
    multiply(mat: Mat3): Mat3;
    buffer(): Float32Array;
}
