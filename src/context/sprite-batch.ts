import { Level } from "../level";
import { ObjectSprite, SpriteColorType, SpriteSheet, ZLayer } from "../object/info/object-info";
import { GameObject } from "../object/object";
import { Vec2 } from "../util/vec2";
import { BufferObject } from "./buffer";
import { VertexArray } from "./vertex-array";
import { ArrayType, BufferArrayBuilder } from "./buffer-array-builder";
import { ShaderProgram } from "./program";
import isBlendingOnTop from "../../assets/blending_on_top.json";
import { Renderer } from "../renderer";

const attributes = {
    ["aPos"]:       ArrayType.FLOAT2,
    ["aObjPos"]:    ArrayType.FLOAT2,
    ["aCol"]:       ArrayType.SHORT,
    ["aFlags"]:     ArrayType.SHORT,
    ["aHsv"]:       ArrayType.SHORT,
    ["aTransform"]: ArrayType.SHORT,
    ["aTex"]:       ArrayType.FLOAT2,
    ["aGroups"]:    ArrayType.SHORT4
};

const QUAD_VERTICIES = [
    new Vec2( 0, 0 ),
    new Vec2( 0, 1 ),
    new Vec2( 1, 1 ),
    new Vec2( 1, 0 )
];

const QUAD_INDICIES = [0, 1, 2, 2, 3, 0];

interface IndexBuffer {
    buffer: BufferObject,
    indexSize: number
};

export class SpriteBatch {
    builder: BufferArrayBuilder = new BufferArrayBuilder(attributes);

    zlayer: ZLayer;
    spriteSheet: SpriteSheet;

    level: Level;
    renderer: Renderer;
    gl: WebGL2RenderingContext;

    vertexBuffer: BufferObject | null = null;
    vertexArray: VertexArray | null = null;

    colorChannelsUsedInBatch: Set<number> = new Set<number>();
    spritesColorChannels: number[] = [];

    colorChannelEnabledStatesIndexBuffers: [Set<number>, IndexBuffer][] = [];

    allObjectsIndexBuffer: IndexBuffer | null = null;

    indexBufferByBlendingStateId: { [id: number]: [IndexBuffer, IndexBuffer] } = {};

    vertexCount: number = 0;

    constructor(level: Level, renderer: Renderer, zlayer: ZLayer, spriteSheet: SpriteSheet) {
        if (!renderer.ctx.gl)
            throw new Error("no!");

        this.renderer = renderer;
        this.gl = renderer.ctx.gl;
        this.level = level;
        this.zlayer = zlayer;
        this.spriteSheet = spriteSheet;
    }

    addObjectSprite(object: GameObject, sprite: ObjectSprite) {
        if (sprite.colorType == SpriteColorType.GLOW)
            return;

        const spriteFrame = this.renderer.spriteFrames[sprite.frameName];
        if (!spriteFrame)
            return;

        const crop = spriteFrame.crop;

        let cropL = crop.x;
        let cropT = crop.y;
        let cropR: number, cropB: number;

        let texCoords: Vec2[];
        
        if (spriteFrame.rotated) {
            cropR = crop.x + crop.h;
            cropB = crop.y + crop.w;

            if (sprite.flipX) [cropB, cropT] = [cropT, cropB];
            if (sprite.flipY) [cropL, cropR] = [cropR, cropL];

            texCoords = [
                new Vec2( cropL, cropT ),
                new Vec2( cropR, cropT ),
                new Vec2( cropR, cropB ),
                new Vec2( cropL, cropB )
            ];
        } else {
            cropR = crop.x + crop.w;
            cropB = crop.y + crop.h;

            if (sprite.flipX) [cropL, cropR] = [cropR, cropL];
            if (sprite.flipY) [cropB, cropT] = [cropT, cropB];
            
            texCoords = [
                new Vec2( cropL, cropB ),
                new Vec2( cropL, cropT ),
                new Vec2( cropR, cropT ),
                new Vec2( cropR, cropB )
            ];
        }

        let relativeOffset = sprite.spriteOffset;

        if (sprite.flipX)
            relativeOffset = new Vec2(-relativeOffset.x, relativeOffset.y);
        if (sprite.flipY)
            relativeOffset = new Vec2(relativeOffset.x, -relativeOffset.y);

        const offsetPosition = new Vec2(
            relativeOffset.x + (sprite.contentSize.x - spriteFrame.cropSize.x) / 2,
            relativeOffset.y + (sprite.contentSize.y - spriteFrame.cropSize.y) / 2
        );

        let verticies = [];

        for (const vertex of QUAD_VERTICIES)
            verticies.push(vertex.mul(spriteFrame.cropSize).add(offsetPosition));

        let aFlags = 0;

        aFlags |= spriteFrame.sheet == 2 ? 1 : 0;
        aFlags |= sprite.colorType == SpriteColorType.BLACK ? 2 : 0;
        aFlags |= object.isTrigger() ? 4 : 0;

        let groups = this.level.groupManager.getGroupCombination(object.groupComb ?? null);
        groups = groups.slice();

        while (groups.length < 4)
            groups.push(0);

        if (groups.length > 4)
            groups = groups.slice(0, 4);

        const transformId = this.level.transformManager.groupCombIdxToTransformIdx[object.groupComb] ?? 0;

        let hsvId = 0;
        switch (sprite.colorType) {
        case SpriteColorType.BASE: hsvId = object.baseHSVShiftId; break;
        case SpriteColorType.DETAIL: hsvId = object.detailHSVShiftId; break;
        }

        const colorChannel = object.getColorChannel(sprite.colorType);

        this.colorChannelsUsedInBatch.add(colorChannel);
        this.spritesColorChannels.push(colorChannel);

        for (let i = 0; i < QUAD_VERTICIES.length; i++) {
            this.builder.add({
                aPos: object.getModelMatrix().transform(sprite.modelTransform.transform(verticies[i])).buffer(),
                aObjPos: object.position.buffer(),
                aCol: colorChannel,
                aFlags,
                aTex: texCoords[i].buffer(),
                aGroups: groups,
                aTransform: transformId,
                aHsv: hsvId
            });
        }

        this.vertexCount += 4;
    }

    generateIndiciesWithBlendingStates(blendingStates: { [channel: number]: boolean }, blendingStatesId: number) {
        let normalChannels: Set<number> = new Set<number>();
        let blendingChannels: Set<number> = new Set<number>();

        for (const [channel, blending] of Object.entries(blendingStates)) {
            if (!blending)
                normalChannels.add(+channel);
            else
                blendingChannels.add(+channel);
        }

        normalChannels   = normalChannels.intersection(this.colorChannelsUsedInBatch);
        blendingChannels = blendingChannels.intersection(this.colorChannelsUsedInBatch);

        const normalIndexBuffer   = this.generateIndexBufferWithEnabledChannels(normalChannels);
        const blendingIndexBuffer = this.generateIndexBufferWithEnabledChannels(blendingChannels);

        this.indexBufferByBlendingStateId[blendingStatesId] = [normalIndexBuffer, blendingIndexBuffer];
    }

    private generateIndexBufferWithEnabledChannels(enabledColorChannels: Set<number>): IndexBuffer {
        for (const [set, buffer] of this.colorChannelEnabledStatesIndexBuffers) {
            if (set == enabledColorChannels)
                return buffer;
        }

        let indexCount = 0;

        for (const spriteColorChannel of this.spritesColorChannels) {
            if (enabledColorChannels.has(spriteColorChannel))
                indexCount += 6;
        }

        const indexSize = (this.vertexCount > 65536) ? 4 : 2;

        const buffer = new ArrayBuffer(indexCount * indexSize);
        let view = new DataView(buffer);

        let offset = 0;
        let quadIndex = 0;
        for (const spriteColorChannel of this.spritesColorChannels) {
            if (enabledColorChannels.has(spriteColorChannel)) {
                for (const index of QUAD_INDICIES) {
                    if (indexSize == 2)
                        view.setUint16(offset, quadIndex + index, true);
                    else
                        view.setUint32(offset, quadIndex + index, true);
                    offset += indexSize;
                }
            }
            quadIndex += 4;
        }

        const bufferObject = new BufferObject(this.gl, this.gl.ELEMENT_ARRAY_BUFFER);
        bufferObject.writeFull(buffer, false);

        const ret: IndexBuffer = { buffer: bufferObject, indexSize };

        this.colorChannelEnabledStatesIndexBuffers.push([enabledColorChannels, ret]);
        return ret;
    }

    generateIndexBufferWithAllObjects() {
        this.allObjectsIndexBuffer = this.generateIndexBufferWithEnabledChannels(this.colorChannelsUsedInBatch);
    }

    generateAndCleanUp(program: ShaderProgram) {
        this.vertexBuffer = new BufferObject(this.gl);
        this.vertexBuffer.writeFull(this.builder.generateBuffer(), false);

        this.vertexArray = this.builder.createVertexArray(this.gl, program, this.vertexBuffer);

        this.colorChannelsUsedInBatch = new Set<number>();
        this.spritesColorChannels = [];
    }

    private renderIndicies(indexBuffer: IndexBuffer) {
        const gl = this.gl;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer.buffer.vbo);

        console.log(`Rendering ${indexBuffer.buffer.size / indexBuffer.indexSize} indicies`);
        gl.drawElements(
            gl.TRIANGLES,
            indexBuffer.buffer.size / indexBuffer.indexSize,
            (indexBuffer.indexSize == 2) ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT,
            0
        );
    }

    private renderBatch(buffer: IndexBuffer, blending: boolean) {
        const gl = this.gl;
        if (blending)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        else
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        this.renderIndicies(buffer);
    }

    private prepareRender(): boolean {
        const texture = this.renderer.spriteSheetTextures[+this.spriteSheet];
        if (!texture)
            return false;
        
        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture.texture);
        return true;
    }

    render(blendingStatesId: number) {
        if (!this.vertexArray || !this.indexBufferByBlendingStateId[blendingStatesId])
            return;

        if (!this.prepareRender())
            return;

        const [normalIndexBuffer, blendingIndexBuffer] = this.indexBufferByBlendingStateId[blendingStatesId];

        const gl = this.gl;

        this.vertexArray.use();

        this.renderBatch(blendingIndexBuffer, true);
        this.renderBatch(normalIndexBuffer, false);
        
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    renderAll() {
        if (!this.vertexArray || !this.allObjectsIndexBuffer)
            return;

        if (!this.prepareRender())
            return;

        const gl = this.gl;

        this.vertexArray.use();

        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        this.renderIndicies(this.allObjectsIndexBuffer);
        
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
};