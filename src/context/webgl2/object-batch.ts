import { BatchBuffer, BufferedObjectBatch } from "../object-batch";
import { TextureObject } from "../../render/texture-object";
import { ArrayType, BufferArrayBuilder } from "./buffer-array-builder";
import { BufferObject } from "./buffer";
import { BufferArray } from "./buffer-array";
import { ShaderProgram } from "./program";
import { Vec2 } from "../../util/vec2";
import { GDLevel } from "../..";

const attributes = {
    ["aPos"]: ArrayType.FLOAT2,
    ["aObjPos"]: ArrayType.FLOAT2,
    ["aCol"]: ArrayType.SHORT,
    ["aFlags"]: ArrayType.SHORT,
    ["aHsv"]: ArrayType.SHORT,
    ["aTransform"]: ArrayType.SHORT,
    ["aTex"]: ArrayType.FLOAT2,
    ["aGroups"]: ArrayType.SHORT4,
    ["aSCp"]: ArrayType.SHORT4
};


export class WebGLBatchBuffer extends BatchBuffer {
    buffer: BufferObject;
    bufferArray: BufferArray;

    static builder = new BufferArrayBuilder(attributes);

    constructor(gl: WebGL2RenderingContext, program: ShaderProgram, size: number) {
        super(size);
        
        this.buffer = BufferObject.createEmpty(gl, size * WebGLBatchBuffer.builder.instanceSize() * 6, true);
        this.bufferArray = WebGLBatchBuffer.builder.createBufferArray(gl, program, this.buffer);
    }

    static addTextureObject(obj: TextureObject) {
        let groups = obj.groups;
        groups = groups.slice();

        while (groups.length < 4)
            groups.push(0);

        if (groups.length > 4)
            groups = groups.slice(0, 4);

        let r = [];

        let q = [
            new Vec2( -0.5, -0.5 ),
            new Vec2( -0.5,  0.5 ),
            new Vec2(  0.5,  0.5 ),
            new Vec2(  0.5,  0.5 ),
            new Vec2(  0.5, -0.5 ),
            new Vec2( -0.5, -0.5 )
        ];

        const crop = obj.sprite.crop;

        let t_l = crop.x,
            t_r = crop.x + crop.w,
            t_t = crop.y,
            t_b = crop.y + crop.h;

        let t: Vec2[];
        
        if (obj.sprite.rotated) {
            t = [
                new Vec2( t_r, t_t ),
                new Vec2( t_l, t_t ),
                new Vec2( t_l, t_b ),
                new Vec2( t_l, t_b ),
                new Vec2( t_r, t_b ),
                new Vec2( t_r, t_t )
            ];
        } else {
            t = [
                new Vec2( t_l, t_b ),
                new Vec2( t_l, t_t ),
                new Vec2( t_r, t_t ),
                new Vec2( t_r, t_t ),
                new Vec2( t_r, t_b ),
                new Vec2( t_l, t_b )
            ];
        }

        const aSCp = [t_l, t_t, t_r, t_b];

        let aFlags = 0;

        aFlags |= obj.sprite.sheet == 2 ? 1 : 0;
        aFlags |= obj.black ? 2 : 0;
        aFlags |= obj.trigger ? 4 : 0;

        for (let i = 0; i < q.length; i++) {
            WebGLBatchBuffer.builder.add({
                aPos: obj.model.transform(q[i]).buffer(),
                aObjPos: obj.objectPos.buffer(),
                aCol: obj.color,
                aFlags,
                aTex: t[i].buffer(),
                aGroups: groups,
                aTransform: obj.transformId,
                aHsv: obj.hsvId,
                aSCp
            });
        }
    }

    static writeTexturesToBuilder(textures: TextureObject[]) {
        WebGLBatchBuffer.builder.clear();
        for (let tex of textures) {
            WebGLBatchBuffer.addTextureObject(tex);
        }
    }

    write(address: number, textures: TextureObject[]): void {
        WebGLBatchBuffer.writeTexturesToBuilder(textures);

        WebGLBatchBuffer.builder.writeToBuffer(this.buffer, address);
    }

    copyTo(dstBuffer: BatchBuffer, dst: number, src: number, size: number): void {
        if (!(dstBuffer instanceof WebGLBatchBuffer))  {
            console.error("Copy: Destination buffer is not instance of WebGLBatchBuffer");
            return;
        }

        WebGLBatchBuffer.builder.copy(this.buffer, dstBuffer.buffer, src, dst, size);
    }

    destroy() {
        this.bufferArray.destroy();
        this.buffer.destroy();
    }
};

export class WebGLObjectBatch extends BufferedObjectBatch {
    gl: WebGL2RenderingContext;
    program: ShaderProgram;

    constructor(level: GDLevel, gl: WebGL2RenderingContext, program: ShaderProgram) {
        super(level);
        
        this.gl = gl;
        this.program = program;
    }

    createBuffer(size: number): BatchBuffer {
        return new WebGLBatchBuffer(this.gl, this.program, size);
    }

    destroyBuffer(buffer: BatchBuffer): void {
        if (buffer instanceof WebGLBatchBuffer)
            buffer.destroy();
    }

    vertexCount(): number {
        return this.buffer.bufferSize * 6;
    }
}