/*
import { BatchBuffer, BufferedObjectBatch } from "./object-batch";
import { TextureObject } from "../render/texture-object";
import { ArrayType, BufferArrayBuilder } from "./buffer-array-builder";
import { BufferObject } from "./buffer";
import { VertexArray } from "./vertex-array";
import { ShaderProgram } from "./program";
import { Vec2 } from "../util/vec2";
import { Level, Renderer } from "..";

const attributes = {
    ["aPos"]:       ArrayType.FLOAT2,
    ["aObjPos"]:    ArrayType.FLOAT2,
    ["aCol"]:       ArrayType.SHORT,
    ["aFlags"]:     ArrayType.SHORT,
    ["aHsv"]:       ArrayType.SHORT,
    ["aTransform"]: ArrayType.SHORT,
    ["aTex"]:       ArrayType.FLOAT2,
    ["aGroups"]:    ArrayType.SHORT4,
    ["aSCp"]:       ArrayType.SHORT4
};

/*
const QUAD_VERTICIES = [
    new Vec2( -0.5, -0.5 ),
    new Vec2( -0.5,  0.5 ),
    new Vec2(  0.5,  0.5 ),
    new Vec2(  0.5,  0.5 ),
    new Vec2(  0.5, -0.5 ),
    new Vec2( -0.5, -0.5 )
];

const QUAD_VERTICIES = [
    new Vec2( 0, 0 ),
    new Vec2( 0, 1 ),
    new Vec2( 1, 1 ),
    new Vec2( 1, 1 ),
    new Vec2( 1, 0 ),
    new Vec2( 0, 0 )
];

let coppa = 0;

export class WebGLBatchBuffer extends BatchBuffer {
    buffer: BufferObject;
    bufferArray: VertexArray;

    static builder = new BufferArrayBuilder(attributes);

    constructor(gl: WebGL2RenderingContext, program: ShaderProgram, size: number) {
        super(size);
        
        this.buffer = BufferObject.createEmpty(gl, size * WebGLBatchBuffer.builder.instanceSize() * 6, true);
        this.bufferArray = WebGLBatchBuffer.builder.createVertexArray(gl, program, this.buffer);
    }

    static addTextureObject(obj: TextureObject) {
        let groups = obj.groups;
        groups = groups.slice();

        while (groups.length < 4)
            groups.push(0);

        if (groups.length > 4)
            groups = groups.slice(0, 4);

        const spriteFrame = obj.sprite.spriteFrame;

        const crop = spriteFrame.crop;

        let cropL = crop.x;
        let cropT = crop.y;
        let cropR: number, cropB: number;

        let texCoords: Vec2[];
        
        if (spriteFrame.rotated) {
            cropR = crop.x + crop.h;
            cropB = crop.y + crop.w;

            if (obj.sprite.flipX) [cropB, cropT] = [cropT, cropB];
            if (obj.sprite.flipY) [cropL, cropR] = [cropR, cropL];

            texCoords = [
                new Vec2( cropL, cropT ),
                new Vec2( cropR, cropT ),
                new Vec2( cropR, cropB ),
                new Vec2( cropR, cropB ),
                new Vec2( cropL, cropB ),
                new Vec2( cropL, cropT )
            ];
        } else {
            cropR = crop.x + crop.w;
            cropB = crop.y + crop.h;

            if (obj.sprite.flipX) [cropL, cropR] = [cropR, cropL];
            if (obj.sprite.flipY) [cropB, cropT] = [cropT, cropB];
            
            texCoords = [
                new Vec2( cropL, cropB ),
                new Vec2( cropL, cropT ),
                new Vec2( cropR, cropT ),
                new Vec2( cropR, cropT ),
                new Vec2( cropR, cropB ),
                new Vec2( cropL, cropB )
            ];
        }

        const aSCp = [cropL, cropT, cropR, cropB];

        let relativeOffset = obj.sprite.spriteOffset;

        if (obj.sprite.flipX)
            relativeOffset = new Vec2(-relativeOffset.x, relativeOffset.y);
        if (obj.sprite.flipY)
            relativeOffset = new Vec2(relativeOffset.x, -relativeOffset.y);

        const offsetPosition = new Vec2(
            relativeOffset.x + (obj.sprite.contentSize.x - spriteFrame.cropSize.x) / 2,
            relativeOffset.y + (obj.sprite.contentSize.y - spriteFrame.cropSize.y) / 2
        );

        let verticies = [];

        for (const vertex of QUAD_VERTICIES)
            verticies.push(vertex.mul(spriteFrame.cropSize).add(offsetPosition));

        let aFlags = 0;

        aFlags |= obj.sprite.spriteFrame.sheet == 2 ? 1 : 0;
        aFlags |= obj.black ? 2 : 0;
        aFlags |= obj.trigger ? 4 : 0;

        for (let i = 0; i < QUAD_VERTICIES.length; i++) {
            WebGLBatchBuffer.builder.add({
                aPos: obj.model.transform(verticies[i]).buffer(),
                aObjPos: obj.objectPos.buffer(),
                aCol: obj.color,
                aFlags,
                aTex: texCoords[i].buffer(),
                aGroups: groups,
                aTransform: obj.transformId,
                aHsv: obj.hsvId,
                aSCp
            });
        }

        coppa++;
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

    constructor(level: Level, gl: WebGL2RenderingContext, program: ShaderProgram) {
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
        if (!this.buffer)
            return 0;
        return this.buffer.bufferSize * 6;
    }
}
*/