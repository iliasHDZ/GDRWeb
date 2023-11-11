import { BufferObject } from './buffer';
export declare class BufferArray {
    gl: WebGL2RenderingContext;
    vao: WebGLVertexArrayObject;
    size: number;
    constructor(gl: WebGL2RenderingContext);
    add(location: number, buffer: BufferObject, size: number, offset: number, stride: number, divisor?: number, type?: number): void;
    use(): void;
}
