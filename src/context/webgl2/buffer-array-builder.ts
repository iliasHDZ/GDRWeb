import { BufferObject } from './buffer';
import { BufferArray } from './buffer-array';
import { ShaderProgram } from './program';

export enum ArrayType {
    FLOAT,
    FLOAT2,
    FLOAT3,
    FLOAT4,
    SHORT,
    SHORT2,
    SHORT3,
    SHORT4
};

export class BufferArrayBuilder {
    layout: { [key: string]: ArrayType };

    data: (number | number[])[];
    public count: number = 0;

    constructor(layout: { [key: string]: ArrayType }) {
        this.layout = layout;
        this.data   = [];
    }

    static getBaseType(type: ArrayType): ArrayType {
        switch (type) {
        case ArrayType.FLOAT:
        case ArrayType.FLOAT2:
        case ArrayType.FLOAT3:
        case ArrayType.FLOAT4:
            return ArrayType.FLOAT;
        case ArrayType.SHORT:
        case ArrayType.SHORT2:
        case ArrayType.SHORT3:
        case ArrayType.SHORT4:
            return ArrayType.SHORT;
        };
    }

    static getTypeCount(type: ArrayType): number {
        switch (type) {
        case ArrayType.FLOAT:  return 1;
        case ArrayType.FLOAT2: return 2;
        case ArrayType.FLOAT3: return 3;
        case ArrayType.FLOAT4: return 4;
        case ArrayType.SHORT:  return 1;
        case ArrayType.SHORT2: return 2;
        case ArrayType.SHORT3: return 3;
        case ArrayType.SHORT4: return 4;
        }
    }

    static getGLType(gl: WebGL2RenderingContext, type: ArrayType): number {
        switch (this.getBaseType(type)) {
        case ArrayType.FLOAT: return gl.FLOAT;
        case ArrayType.SHORT: return gl.UNSIGNED_SHORT;
        default:              return 0;
        }
    }

    static sizeOfType(type: ArrayType): number {
        switch (this.getBaseType(type)) {
        case ArrayType.FLOAT: return 4 * this.getTypeCount(type);
        case ArrayType.SHORT: return 2 * this.getTypeCount(type);
        default:              return 0;
        }
    }

    public instanceSize(): number {
        let ret = 0;
        for (let [_, v] of Object.entries(this.layout))
            ret += BufferArrayBuilder.sizeOfType(v);

        return ret;
    }

    public bufferSize(): number {
        return this.instanceSize() * this.count;
    }

    public add(entry: { [key: string]: any }) {
        for (let [k, _] of Object.entries(this.layout))
            this.data.push(entry[k] ?? 0);
        this.count++;
    }

    insertFloatArray(view: DataView, offset: number, count: number, values: number[]): number {
        for (let i = 0; i < count; i++) {
            view.setFloat32(offset, values[i], true);
            offset += 4;
        }
        return offset;
    }

    insertShortArray(view: DataView, offset: number, count: number, values: number[]): number {
        for (let i = 0; i < count; i++) {
            view.setUint16(offset, values[i], true);
            offset += 2;
        }
        return offset;
    }

    insertData(view: DataView, offset: number, type: ArrayType, value: number | number[]): number {
        if (typeof(value) == 'number')
            value = [value];
        
        switch (BufferArrayBuilder.getBaseType(type)) {
        case ArrayType.FLOAT: return this.insertFloatArray(view, offset, BufferArrayBuilder.getTypeCount(type), value);
        case ArrayType.SHORT: return this.insertShortArray(view, offset, BufferArrayBuilder.getTypeCount(type), value);
        default: return offset;
        };
    }

    public generateBuffer(): ArrayBuffer {
        const buffer = new ArrayBuffer(this.bufferSize());
        
        let view = new DataView(buffer);
        let offset = 0;
        let index = 0;

        for (let i = 0; i < this.count; i++) {
            for (let [_, v] of Object.entries(this.layout)) {
                offset = this.insertData(view, offset, v, this.data[index]);
                index++;
            }
        }

        console.log("Buffer generated, size: " + buffer.byteLength);
        return buffer;
    }

    public compile(gl: WebGL2RenderingContext, program: ShaderProgram): BufferArray {
        const buffer = new BufferObject(gl, this.generateBuffer());
        const array  = new BufferArray(gl);

        const stride = this.instanceSize();
        let offset = 0;

        console.log(stride);

        for (let [k, v] of Object.entries(this.layout)) {
            array.add(
                program.attrib(k),
                buffer,
                BufferArrayBuilder.getTypeCount(v),
                offset,
                stride,
                0,
                BufferArrayBuilder.getGLType(gl, v)
            );
            offset += BufferArrayBuilder.sizeOfType(v);
        }

        return array;
    }
};