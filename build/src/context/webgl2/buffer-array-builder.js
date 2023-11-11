"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferArrayBuilder = exports.ArrayType = void 0;
const buffer_1 = require("./buffer");
const buffer_array_1 = require("./buffer-array");
var ArrayType;
(function (ArrayType) {
    ArrayType[ArrayType["FLOAT"] = 0] = "FLOAT";
    ArrayType[ArrayType["FLOAT2"] = 1] = "FLOAT2";
    ArrayType[ArrayType["FLOAT3"] = 2] = "FLOAT3";
    ArrayType[ArrayType["FLOAT4"] = 3] = "FLOAT4";
    ArrayType[ArrayType["SHORT"] = 4] = "SHORT";
    ArrayType[ArrayType["SHORT2"] = 5] = "SHORT2";
    ArrayType[ArrayType["SHORT3"] = 6] = "SHORT3";
    ArrayType[ArrayType["SHORT4"] = 7] = "SHORT4";
})(ArrayType = exports.ArrayType || (exports.ArrayType = {}));
;
class BufferArrayBuilder {
    constructor(layout) {
        this.count = 0;
        this.layout = layout;
        this.data = [];
    }
    static getBaseType(type) {
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
        }
        ;
    }
    static getTypeCount(type) {
        switch (type) {
            case ArrayType.FLOAT: return 1;
            case ArrayType.FLOAT2: return 2;
            case ArrayType.FLOAT3: return 3;
            case ArrayType.FLOAT4: return 4;
            case ArrayType.SHORT: return 1;
            case ArrayType.SHORT2: return 2;
            case ArrayType.SHORT3: return 3;
            case ArrayType.SHORT4: return 4;
        }
    }
    static getGLType(gl, type) {
        switch (this.getBaseType(type)) {
            case ArrayType.FLOAT: return gl.FLOAT;
            case ArrayType.SHORT: return gl.UNSIGNED_SHORT;
            default: return 0;
        }
    }
    static sizeOfType(type) {
        switch (this.getBaseType(type)) {
            case ArrayType.FLOAT: return 4 * this.getTypeCount(type);
            case ArrayType.SHORT: return 2 * this.getTypeCount(type);
            default: return 0;
        }
    }
    instanceSize() {
        let ret = 0;
        for (let [_, v] of Object.entries(this.layout))
            ret += BufferArrayBuilder.sizeOfType(v);
        return ret;
    }
    bufferSize() {
        return this.instanceSize() * this.count;
    }
    add(entry) {
        for (let [k, _] of Object.entries(this.layout))
            this.data.push(entry[k] ?? 0);
        this.count++;
    }
    insertFloatArray(view, offset, count, values) {
        for (let i = 0; i < count; i++) {
            view.setFloat32(offset, values[i], true);
            offset += 4;
        }
        return offset;
    }
    insertShortArray(view, offset, count, values) {
        for (let i = 0; i < count; i++) {
            view.setUint16(offset, values[i], true);
            offset += 2;
        }
        return offset;
    }
    insertData(view, offset, type, value) {
        if (typeof (value) == 'number')
            value = [value];
        switch (BufferArrayBuilder.getBaseType(type)) {
            case ArrayType.FLOAT: return this.insertFloatArray(view, offset, BufferArrayBuilder.getTypeCount(type), value);
            case ArrayType.SHORT: return this.insertShortArray(view, offset, BufferArrayBuilder.getTypeCount(type), value);
            default: return offset;
        }
        ;
    }
    generateBuffer() {
        const buffer = new ArrayBuffer(this.bufferSize());
        let view = new DataView(buffer);
        let offset = 0;
        let index = 0;
        for (let i = 0; i < this.count; i++) {
            for (let [n, v] of Object.entries(this.layout)) {
                if (!n.startsWith('_'))
                    offset = this.insertData(view, offset, v, this.data[index]);
                else
                    offset += BufferArrayBuilder.sizeOfType(v);
                index++;
            }
        }
        console.log("Buffer generated, size: " + buffer.byteLength);
        return buffer;
    }
    compile(gl, program) {
        const buffer = new buffer_1.BufferObject(gl, this.generateBuffer());
        const array = new buffer_array_1.BufferArray(gl);
        const stride = this.instanceSize();
        let offset = 0;
        for (let [k, v] of Object.entries(this.layout)) {
            if (!k.startsWith('_')) {
                array.add(program.attrib(k), buffer, BufferArrayBuilder.getTypeCount(v), offset, stride, 0, BufferArrayBuilder.getGLType(gl, v));
            }
            offset += BufferArrayBuilder.sizeOfType(v);
        }
        return array;
    }
}
exports.BufferArrayBuilder = BufferArrayBuilder;
;
