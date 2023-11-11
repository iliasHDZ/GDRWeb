import { RenderContext } from './context';
import { Color } from './../util/color';
import { ObjectBatch } from '../render/object-batch';
import { ShaderProgram } from './webgl2/program';
import { BufferArray } from './webgl2/buffer-array';
import { Mat3 } from '../util/mat3';
import { Vec2 } from '../util/vec2';
import { SpriteCrop, SpriteCropInfo } from '../util/sprite';
import { GroupState } from '../groups';
import { HSVShift } from '../util/hsvshift';
export declare class WebGLContext extends RenderContext {
    gl: WebGL2RenderingContext;
    canvas: HTMLCanvasElement;
    program: ShaderProgram;
    colors: number[];
    colorsBlending: number[];
    groupStates: {
        [id: number]: GroupState;
    };
    objectHSVs: {
        [id: number]: HSVShift;
    };
    lastGroupId: number;
    lastHSVId: number;
    colorInfoTexture: WebGLTexture;
    groupStateTexture: WebGLTexture;
    objectHSVTexture: WebGLTexture;
    quadShader: ShaderProgram;
    quad: BufferArray;
    viewMatrix: Mat3;
    constructor(canvas: HTMLCanvasElement);
    setSize(width: number, height: number): void;
    setViewMatrix(view: Mat3): void;
    init(): void;
    setColorChannel(channel: number, color: Color, blending: boolean): void;
    setGroupState(groupId: number, state: GroupState): void;
    setObjectHSV(hsvId: number, hsv: HSVShift): void;
    createInfoTexture(): WebGLTexture;
    updateInfoTexture(buffer: Uint8Array, texture: WebGLTexture, width: number): void;
    updateFloatInfoTexture(buffer: Float32Array, texture: WebGLTexture, width: number): void;
    updateGroupStateTexture(): void;
    updateColorInfoTexture(): void;
    updateHSVObjectTexture(): void;
    clearColor(c: Color): void;
    loadTexture(img: HTMLImageElement): WebGLTexture;
    genQuadStructs(m: Mat3, c: number, sprite: SpriteCropInfo, groups: number[], hsvId: number): any;
    genQuad(m: Mat3, c: number, sprite: SpriteCropInfo): number[];
    genInstance(m: Mat3, c: Color, s: SpriteCrop): number[];
    compileObjects(c: ObjectBatch): {
        count: number;
        array: BufferArray;
    };
    fillRect(pos: Vec2, size: Vec2, color: Color): void;
    render(c: ObjectBatch): void;
}
