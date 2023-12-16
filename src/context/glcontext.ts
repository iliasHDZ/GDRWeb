import { ContextRenderOptions, RenderContext } from './context';
import { Color } from './../util/color';
import { ObjectBatch } from './object-batch';
import { ShaderProgram } from './webgl2/program';
import { BufferObject } from './webgl2/buffer';
import { BufferArray } from './webgl2/buffer-array';
import { ArrayType, BufferArrayBuilder } from './webgl2/buffer-array-builder';
import { Mat3 } from '../util/mat3';
import { Vec2 } from '../util/vec2';
import { SpriteCrop, SpriteCropInfo } from '../util/sprite';
import { GroupState } from '../group-manager';
import { HSVShift } from '../util/hsvshift';
import { Profiler } from '../profiler';
import { TextureObject } from '../render/texture-object';
import { PulseColorEntry, PulseHSVEntry } from '../pulse/pulse-entry';
import { GroupTransform } from '../transform/group-transform';
import { WebGLBatchBuffer, WebGLObjectBatch } from './webgl2/object-batch';
import { Level } from '..';

declare const VERT_SOURCE: string;
declare const FRAG_SOURCE: string;
declare const QUAD_VERT_SOURCE: string;
declare const QUAD_FRAG_SOURCE: string;

// @ts-ignore
import VERT_SOURCE from "./webgl2/shaders/objects.vert?raw";
// @ts-ignore
import FRAG_SOURCE from "./webgl2/shaders/objects.frag?raw";
// @ts-ignore
import QUAD_VERT_SOURCE from "./webgl2/shaders/quad.vert?raw";
// @ts-ignore
import QUAD_FRAG_SOURCE from "./webgl2/shaders/quad.frag?raw";

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

const GROUP_STATE_TEXTURE_WIDTH = 512;
const FLOATS_PER_GROUP_STATE = 8;
const FLOATS_PER_GROUP_TRANSFORM = 12;

const OBJECT_HSV_TEXTURE_WIDTH = 256;
const BYTES_PER_OBJECT_HSV = 4;

const QUAD_VERTICES = new Float32Array([
    -0.5,  0.5,
    -0.5, -0.5,
     0.5,  0.5,
     0.5, -0.5
]);

export class WebGLContext extends RenderContext {
    gl: WebGL2RenderingContext;

    program: ShaderProgram;

    colors: number[];
    colorsBlending: number[];

    groupStates: { [id: number]: GroupState } = {};
    objectHSVs: { [id: number]: HSVShift } = {};
    groupTransforms: { [id: number]: GroupTransform } = {};

    lastGroupId: number = 0;
    lastHSVId: number = 0;
    lastTransformId: number = 0;

    colorInfoTexture: WebGLTexture;
    groupStateTexture: WebGLTexture;
    objectHSVTexture: WebGLTexture;
    pulseTexture: WebGLTexture;
    transformTexture: WebGLTexture;

    pulseTextureSelections: { [id: number]: [number, number] } = {};

    quadShader: ShaderProgram;
    quad: BufferArray;

    viewMatrix: Mat3;

    /*
    private texWidth: number;
    private texHeight: number;
    private texCount: number;
    */

    constructor(canvas: HTMLCanvasElement) {
        super();

        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2', {
            premultipliedAlpha: true,
            alpha: false
        });

        this.init();
    }

    setProfiler(profiler: Profiler) {
        
    }

    setSize(width: number, height: number) {
        this.gl.viewport(0, 0, width, height);
    }

    setViewMatrix(view: Mat3) {
        this.program.use();
        this.program.uMat3('uView', view);
        this.viewMatrix = view;
    }

    init() {
        let gl = this.gl;
        let p  = new ShaderProgram(gl);

        p.loadShader(gl.VERTEX_SHADER,   VERT_SOURCE);
        p.loadShader(gl.FRAGMENT_SHADER, FRAG_SOURCE);

        p.link();

        this.program = p;

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        //gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ZERO);

        this.colors = [];
        this.colorsBlending = [];

        for (let i = 0; i < 1011 * 4; i++)
            this.colors.push(0);

        for (let i = 0; i < 1011; i++)
            this.colorsBlending.push(0);

        this.colorInfoTexture  = this.createInfoTexture();
        this.groupStateTexture = this.createInfoTexture();
        this.objectHSVTexture  = this.createInfoTexture();
        this.pulseTexture      = this.createInfoTexture();
        this.transformTexture  = this.createInfoTexture();

        this.quadShader = new ShaderProgram(gl);
        this.quadShader.loadShader(gl.VERTEX_SHADER,   QUAD_VERT_SOURCE);
        this.quadShader.loadShader(gl.FRAGMENT_SHADER, QUAD_FRAG_SOURCE);
        this.quadShader.link();

        this.quad = new BufferArray(gl);
        this.quad.add(
            this.quadShader.attrib('aPos'),
            BufferObject.fromData(gl, QUAD_VERTICES),
            2,
            0,
            2 * 4
        );
    }

    setColorChannel(channel: number, color: Color, blending: boolean) {
        if (channel < 0 || channel > 1011) return;

        this.colors[channel * 4]     = color.r;
        this.colors[channel * 4 + 1] = color.g;
        this.colors[channel * 4 + 2] = color.b;
        this.colors[channel * 4 + 3] = color.a;

        this.colorsBlending[channel] = blending ? 1 : 0;
    }

    setGroupState(groupId: number, state: GroupState) {
        this.groupStates[groupId] = state;

        if (groupId > this.lastGroupId)
            this.lastGroupId = groupId;
    }

    setGroupTransform(transformId: number, state: GroupTransform) {
        this.groupTransforms[transformId] = state;

        if (transformId > this.lastTransformId)
            this.lastTransformId = transformId;
    }

    setObjectHSV(hsvId: number, hsv: HSVShift) {
        this.objectHSVs[hsvId] = hsv;

        if (hsvId > this.lastHSVId)
            this.lastHSVId = hsvId;
    }

    createInfoTexture(): WebGLTexture {
        let gl = this.gl;

        const ret = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, ret);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        return ret;
    }

    updateInfoTexture(buffer: Uint8Array, texture: WebGLTexture, width: number) {
        let gl = this.gl;

        const height = Math.ceil(Math.ceil(buffer.length / 4) / width);
        const totalBytes = height * width * 4;
        
        let newBuffer = new Uint8Array(totalBytes);
        let i = 0;
        for (; i < buffer.length; i++)
            newBuffer[i] = buffer[i];

        for (; i < totalBytes; i++)
            newBuffer[i] = 0;

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            width,
            height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            newBuffer
        );
    }

    updateFloatInfoTexture(buffer: Float32Array, texture: WebGLTexture, width: number) {
        let gl = this.gl;

        const height = Math.ceil(Math.ceil(buffer.length / 4) / width);
        const totalFloats = height * width * 4;
        
        let newBuffer = new Float32Array(totalFloats);
        let i = 0;
        for (; i < buffer.length; i++)
            newBuffer[i] = buffer[i];

        for (; i < totalFloats; i++)
            newBuffer[i] = 0;

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA32F,
            width,
            height,
            0,
            gl.RGBA,
            gl.FLOAT,
            newBuffer
        );
    }

    updateGroupStateTexture() {
        const fpgs = FLOATS_PER_GROUP_STATE;

        const size = Math.ceil(fpgs / 4) * (this.lastGroupId + 1);
        let buffer = new Float32Array(size * 4);

        for (let i = 0; i < buffer.length; i++)
            buffer[i] = 0;

        for (let [id, state] of Object.entries(this.groupStates)) {
            const pulseSelection = this.pulseTextureSelections[+id];

            buffer[+id * fpgs + 0] = state.active ? state.opacity : 0;
            buffer[+id * fpgs + 1] = 0;
            buffer[+id * fpgs + 2] = 0;
            buffer[+id * fpgs + 3] = 0;
            buffer[+id * fpgs + 4] = pulseSelection[0];
            buffer[+id * fpgs + 5] = pulseSelection[1];
            buffer[+id * fpgs + 6] = 0;
            buffer[+id * fpgs + 7] = 0;
        }

        this.updateFloatInfoTexture(buffer, this.groupStateTexture, GROUP_STATE_TEXTURE_WIDTH);
    }

    updateGroupTransformTexture() {
        const fpgt = FLOATS_PER_GROUP_TRANSFORM;

        const size = Math.ceil(fpgt / 4) * (this.lastTransformId + 1);
        let buffer = new Float32Array(size * 4);

        for (let i = 0; i < buffer.length; i++)
            buffer[i] = 0;

        for (let [id, transform] of Object.entries(this.groupTransforms)) {
            buffer[+id * fpgt + 0]  = transform.offset.x;
            buffer[+id * fpgt + 1]  = transform.offset.y;
            buffer[+id * fpgt + 2]  = 0;
            buffer[+id * fpgt + 3]  = 0;
            buffer[+id * fpgt + 4]  = transform.right.x;
            buffer[+id * fpgt + 5]  = transform.right.y;
            buffer[+id * fpgt + 6]  = transform.up.x;
            buffer[+id * fpgt + 7]  = transform.up.y;
            buffer[+id * fpgt + 8]  = transform.objRight.x;
            buffer[+id * fpgt + 9]  = transform.objRight.y;
            buffer[+id * fpgt + 10] = transform.objUp.x;
            buffer[+id * fpgt + 11] = transform.objUp.y;
        }

        this.updateFloatInfoTexture(buffer, this.transformTexture, 512);
    }

    updateColorInfoTexture() {
        let gl = this.gl;

        let buffer = new Uint8Array(2 * 1011 * 4);

        for (let i = 0; i < 1011; i++) {
            buffer[i * 8 + 0] = this.colors[i * 4 + 0] * 255;
            buffer[i * 8 + 1] = this.colors[i * 4 + 1] * 255;
            buffer[i * 8 + 2] = this.colors[i * 4 + 2] * 255;
            buffer[i * 8 + 3] = this.colors[i * 4 + 3] * 255;
            buffer[i * 8 + 4] = this.colorsBlending[i] * 255;
        }

        gl.bindTexture(gl.TEXTURE_2D, this.colorInfoTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            2,
            1011,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            buffer
        );
    }

    setHSVIntoBuffer(buffer: Uint8Array, idx: number, hsv: HSVShift) {
        const hueNeg = (hsv.hue < 0) ? 1 : 0;
        const flags  = (hueNeg << 7) | (+hsv.saturationAddition << 6) | (+hsv.valueAddition << 5);

        buffer[idx + 0] = Math.abs(hsv.hue);
        buffer[idx + 1] = hsv.saturationAddition ? (Math.abs(hsv.saturation * 100) + 128 * +(hsv.saturation < 0)) : hsv.saturation * 127;
        buffer[idx + 2] = hsv.valueAddition ? (Math.abs(hsv.value * 100) + 128 * +(hsv.value < 0)) : hsv.value * 127;
        buffer[idx + 3] = flags;
    }

    updateHSVObjectTexture() {
        const bpoh = BYTES_PER_OBJECT_HSV;

        const size = Math.ceil(bpoh / 4) * (this.lastHSVId + 1);
        let buffer = new Uint8Array(size * 4);

        for (let i = 0; i < buffer.length; i++)
            buffer[i] = 0;

        for (let [id, hsv] of Object.entries(this.objectHSVs)) {
            const idx = +id * bpoh;

            this.setHSVIntoBuffer(buffer, idx, hsv);
        }

        this.updateInfoTexture(buffer, this.objectHSVTexture, OBJECT_HSV_TEXTURE_WIDTH);
    }

    updatePulseTexture() {
        const bppe = 8;

        let count = 0;
        for (let v of Object.values(this.groupStates))
            count += v.pulseList.entries.length;

        let buffer = new Uint8Array(count * bppe);

        for (let i = 0; i < buffer.length; i++)
            buffer[i] = 0;

        let idx = 0;
        for (let [id, state] of Object.entries(this.groupStates)) {
            const groupId  = +id;
            const startIdx = idx / bppe;

            for (let entry of state.pulseList.entries) {
                buffer[idx + 0] = entry.intensity * 255;
                buffer[idx + 1] = entry.baseOnly ? 1 : 0;
                buffer[idx + 2] = entry.detailOnly ? 1 : 0;
                if (entry instanceof PulseColorEntry) {
                    buffer[idx + 3] = 100;
                    buffer[idx + 4] = entry.color.r * 255;
                    buffer[idx + 5] = entry.color.g * 255;
                    buffer[idx + 6] = entry.color.b * 255;
                    buffer[idx + 7] = entry.color.a * 255;
                } else if (entry instanceof PulseHSVEntry) {
                    buffer[idx + 3] = 255;
                    this.setHSVIntoBuffer(buffer, idx + 4, entry.hsv);
                } else
                    buffer[idx + 3] = 0;

                idx += bppe;
            }

            const size = (idx / bppe) - startIdx;
            this.pulseTextureSelections[groupId] = [startIdx, size];
        }

        this.updateInfoTexture(buffer, this.pulseTexture, 256);
    }

    clearColor(c: Color) {
        let gl = this.gl;

        gl.clearColor(c.r, c.g, c.b, c.a);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    loadTexture(img: HTMLImageElement) {
        let gl = this.gl;

        let t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            img
        );

        return t;
    }

    genQuadStructs(obj: TextureObject): any {
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
            r.push({
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

        return r;
    }

    genInstance(m: Mat3, c: Color, s: SpriteCrop): number[] {
        let r = [];

        let a = new Mat3();

        a.scale(new Vec2(30, 30));

        r.push(...a.buffer());
        //r.push(s.x, s.y, s.w, s.h);
        //r.push(...c.buffer());

        return r;
    }

    /*compileObjects(c: ObjectBatch) {
        const builder = new BufferArrayBuilder(attributes);

        for (let o of c.objects) {
            const quad = this.genQuadStructs(o);
            for (let a of quad)
                builder.add(a);
        }
        
        return {
            count: c.objects.length * 6,
            array: builder.compile(this.gl, this.program)
        };
    }*/

    createObjectBatch(level: Level): ObjectBatch {
        return new WebGLObjectBatch(level, this.gl, this.program);
    }

    fillRect(pos: Vec2, size: Vec2, color: Color) {
        let gl = this.gl;

        let model = new Mat3();
        model.translate(pos);
        model.scale(size);

        this.quadShader.use();
        this.quad.use();

        this.quadShader.uMat3('uView', this.viewMatrix);
        this.quadShader.uMat3('uModel', model);
        this.quadShader.uColor('uColor', color);
        this.quadShader.uInteger('uTextureEnabled', 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    renderTexture(pos: Vec2, size: Vec2, texture: any, color: Color) {
        let gl = this.gl;

        let model = new Mat3();
        model.translate(pos);
        model.scale(size);

        this.quadShader.use();
        this.quad.use();

        this.quadShader.uMat3('uView', this.viewMatrix);
        this.quadShader.uMat3('uModel', model);
        this.quadShader.uColor('uColor', color);
        this.quadShader.uInteger('uTextureEnabled', 1);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        this.quadShader.uInteger('uTexture', 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    render(batch: ObjectBatch, options: ContextRenderOptions | null, mainTexture: any, secondTexture: any) {
        if (!(batch instanceof WebGLObjectBatch))
            return;

        const buffer = batch.buffer;
        if (!(buffer instanceof WebGLBatchBuffer))
            return;

        let gl = this.gl;

        if (options == null)
            options = new ContextRenderOptions();

        this.program.use();
        buffer.bufferArray.use();

        this.updateColorInfoTexture();
        this.updatePulseTexture();
        this.updateGroupStateTexture();
        this.updateHSVObjectTexture();
        this.updateGroupTransformTexture();

        this.program.uInteger('uHideTriggers', options.hideTriggers ? 1 : 0);

        this.program.uInteger('uTexture', 0);
        this.program.uInteger('uSecondTexture', 1);
        this.program.uInteger('uColorInfoTexture', 2);
        this.program.uInteger('uGroupStateTexture', 3);
        this.program.uInteger('uObjectHSVTexture', 4);
        this.program.uInteger('uPulseTexture', 5);
        this.program.uInteger('uTransformTexture', 6);

        if (mainTexture.loaded) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, mainTexture.texture);

            if (secondTexture && secondTexture.loaded) {
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, secondTexture.texture);
            }
            
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, this.colorInfoTexture);
            
            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, this.groupStateTexture);
            
            gl.activeTexture(gl.TEXTURE4);
            gl.bindTexture(gl.TEXTURE_2D, this.objectHSVTexture);
            
            gl.activeTexture(gl.TEXTURE5);
            gl.bindTexture(gl.TEXTURE_2D, this.pulseTexture);
            
            gl.activeTexture(gl.TEXTURE6);
            gl.bindTexture(gl.TEXTURE_2D, this.transformTexture);

            gl.drawArrays(gl.TRIANGLES, 0, batch.vertexCount());
        }
    }
}