import { BufferArray } from './buffer-array';
import { ShaderProgram } from './program';
export declare enum ArrayType {
    FLOAT = 0,
    FLOAT2 = 1,
    FLOAT3 = 2,
    FLOAT4 = 3,
    SHORT = 4,
    SHORT2 = 5,
    SHORT3 = 6,
    SHORT4 = 7
}
export declare class BufferArrayBuilder {
    layout: {
        [key: string]: ArrayType;
    };
    data: (number | number[])[];
    count: number;
    constructor(layout: {
        [key: string]: ArrayType;
    });
    static getBaseType(type: ArrayType): ArrayType;
    static getTypeCount(type: ArrayType): number;
    static getGLType(gl: WebGL2RenderingContext, type: ArrayType): number;
    static sizeOfType(type: ArrayType): number;
    instanceSize(): number;
    bufferSize(): number;
    add(entry: {
        [key: string]: any;
    }): void;
    insertFloatArray(view: DataView, offset: number, count: number, values: number[]): number;
    insertShortArray(view: DataView, offset: number, count: number, values: number[]): number;
    insertData(view: DataView, offset: number, type: ArrayType, value: number | number[]): number;
    generateBuffer(): ArrayBuffer;
    compile(gl: WebGL2RenderingContext, program: ShaderProgram): BufferArray;
}
