import { RenderContext } from './context';
import { Color } from './../util/color';
import { ObjectBatch } from '../render/object-batch';
import { ShaderProgram } from './webgl2/program';
import { BufferObject } from './webgl2/buffer';
import { BufferArray } from './webgl2/buffer-array';
import { ArrayType, BufferArrayBuilder } from './webgl2/buffer-array-builder';
import { Mat3 } from '../util/mat3';
import { Vec2 } from '../util/vec2';
import { SpriteCrop, SpriteCropInfo } from '../util/sprite';
import { GroupState } from '../groups';
import { HSVShift } from '../util/hsvshift';

const VERT_SOURCE = `#version 300 es

in vec2 aPos;
in vec2 aTex;
in vec4 aGroups;
in float aHsv;
in vec4 aSCp;

in float aFlags;
in float aCol;

uniform mat3 uView;

out vec2 oTex;
out vec4 oSCp;

out vec4 oColor;
out float oAlpha;

flat out int oBlending;

flat out int oFlags;

uniform sampler2D uColorInfoTexture;
uniform sampler2D uGroupStateTexture;
uniform sampler2D uObjectHSVTexture;

struct GroupState {
    float opacity;
    vec2 offset;
};

struct HSVShift {
    float hue;
    float sat;
    float val;
    bool satAdd;
    bool valAdd;
};

out GroupState oGroup;

vec4 getInfoTexPix(int i, int tex) {
    vec2 size = vec2(0, 0);
    if (tex == 0)
        size = vec2(textureSize(uColorInfoTexture, 0));
    else if (tex == 1)
        size = vec2(textureSize(uGroupStateTexture, 0));
    else
        size = vec2(textureSize(uObjectHSVTexture, 0));

    vec2 texCoords = vec2(mod(float(i), size.x) + 0.5, floor(float(i) / size.x) + 0.5) / size;
    if (tex == 0)
        return texture(uColorInfoTexture, texCoords);
    else if (tex == 1)
        return texture(uGroupStateTexture, texCoords);
    else
        return texture(uObjectHSVTexture, texCoords);
}

GroupState combineGroupStates(GroupState s1, GroupState s2) {
    GroupState res;
    res.opacity = s1.opacity * s2.opacity;
    res.offset  = s1.offset + s2.offset;
    return res;
}

GroupState getGroupState(int id) {
    vec4 a = getInfoTexPix(id, 1);

    GroupState res;
    res.opacity = a.r;
    res.offset  = a.gb;
    return res;
}

GroupState getGroupStateFromGroups(vec4 groups) {
    GroupState current;
    GroupState state;
    bool gsp = false;

    current.opacity = 1.0;
    current.offset  = vec2(0, 0);

    if (groups.x != 0.0) {
        state = getGroupState(int(groups.x));
        if (gsp)
            current = combineGroupStates(current, state);
        else
            current = state;
        gsp = true;
    }

    if (groups.y != 0.0) {
        state = getGroupState(int(groups.y));
        if (gsp)
            current = combineGroupStates(current, state);
        else
            current = state;
        gsp = true;
    }

    if (groups.z != 0.0) {
        state = getGroupState(int(groups.z));
        if (gsp)
            current = combineGroupStates(current, state);
        else
            current = state;
        gsp = true;
    }

    if (groups.w != 0.0) {
        state = getGroupState(int(groups.w));
        if (gsp)
            current = combineGroupStates(current, state);
        else
            current = state;
        gsp = true;
    }

    return current;
}

float pixFloatToSignedFloat(float a) {
    a *= 255.0;
    return (a >= 128.0) ? -mod(a, 128.0) : mod(a, 128.0);
}

HSVShift getObjectHSVShift(int hsvId) {
    vec4 pix = getInfoTexPix(hsvId, 2);

    int flags = int(pix.a * 255.0);

    int hueNeg = flags >> 7;
    int hue = int(pix.r * 255.0) * (hueNeg == 1 ? -1 : 1);

    HSVShift hsv;
    hsv.hue = float(hue) / 360.0;
    hsv.satAdd = ((flags >> 6) & 1) == 1;
    hsv.valAdd = ((flags >> 5) & 1) == 1;
    hsv.sat = hsv.satAdd ? pixFloatToSignedFloat(pix.g) : pix.g * 2.0;
    hsv.val = hsv.valAdd ? pixFloatToSignedFloat(pix.b) : pix.b * 2.0;

    return hsv;
}

// Credits to sam hocevar for the following two functions
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 shiftColor(vec4 color, HSVShift shift) {
    vec3 hsv = rgb2hsv(color.rgb);

    hsv.x = mod(hsv.x + shift.hue, 1.0);

    hsv.y = /*shift.satAdd ? (hsv.y + shift.sat) :*/ (hsv.y * shift.sat);
    hsv.z = /*shift.valAdd ? (hsv.z + shift.val) :*/ (hsv.z * shift.val);

    hsv.y = clamp(hsv.y, 0.0, 1.0);
    hsv.z = clamp(hsv.z, 0.0, 1.0);

    return vec4(hsv2rgb(hsv), color.a);
}

vec4 getChannelColor(int channel) {
    if (int(channel) == 1010)
        return vec4(0, 0, 0, 1);
    else if (int(channel) == 1011)
        return vec4(1, 1, 1, 1);

    float y = (float(channel) + 0.5) / 1011.0;

    return texture(uColorInfoTexture, vec2(0.5 / 2.0, y));
}

bool isChannelBlending(int channel) {
    if (int(channel) == 1010)
        return false;
    else if (int(channel) == 1011)
        return false;

    float y = (float(channel) + 0.5) / 1011.0;

    return texture(uColorInfoTexture, vec2(1.5 / 2.0, y)).r > 0.5;
}

int imod(int a, int n){
    return a - (n * (a/n));
}

void main() {
    oTex = aTex;
    oSCp = aSCp;

    oColor = getChannelColor(int(aCol));
    oBlending = isChannelBlending(int(aCol)) ? 1 : 0;

    GroupState state = getGroupStateFromGroups(aGroups);

    oAlpha = state.opacity;

    if (int(aHsv) != 0) {
        HSVShift shift = getObjectHSVShift(int(aHsv));
        oColor = shiftColor(oColor, shift);
    }

    vec2 position = aPos;

    position += state.offset;

    oFlags = int(aFlags);

    if (imod(oFlags / 2, 2) > 0)
        oColor = vec4(0, 0, 0, 1);

    gl_Position = vec4(uView * vec3(position, 1), 1);
}
`;

const FRAG_SOURCE = `#version 300 es

precision highp float;

out vec4 outColor;

in vec2 oTex;
in vec4 oSCp;

in vec4 oColor;
in float oAlpha;

flat in int oBlending;

flat in int oFlags;

uniform sampler2D uTexture;
uniform sampler2D uSecondTexture;

int imod(int a, int n){
    return a - (n * (a/n));
}

vec4 getTexFrag(vec2 pos) {
    vec2 texCoords = pos / vec2(textureSize(uTexture, 0));
    if (imod(oFlags, 2) > 0)
        return texture(uSecondTexture, texCoords);
    else
        return texture(uTexture, texCoords);
}

void main() {
    if (oAlpha == 0.0)
        discard;

    float cor = 0.5;

    vec2 texPos = vec2(max(min(oTex.x, oSCp.z - cor), oSCp.x + cor), max(min(oTex.y, oSCp.w - cor), oSCp.y + cor));

    vec2 corPos = vec2(floor(texPos.x - 0.5) + 0.5, floor(texPos.y - 0.5) + 0.5);

    vec4 fTL = getTexFrag(corPos);
    vec4 fTR = getTexFrag(corPos + vec2(1, 0));
    vec4 fBL = getTexFrag(corPos + vec2(0, 1));
    vec4 fBR = getTexFrag(corPos + vec2(1, 1));

    bool aTL = fTL.w > 0.0;
    bool aTR = fTR.w > 0.0;
    bool aBL = fBL.w > 0.0;
    bool aBR = fBR.w > 0.0;

    vec4 texFrag;

    if ((aTL || aTR || aBL || aBR) && (!aTL || !aTR || !aBL || !aBR)) {
        int as = 0;

        vec3 avr = vec3(0, 0, 0);

        if (aTL) {
            avr += fTL.xyz;
            as++;
        }
        if (aTR) {
            avr += fTR.xyz;
            as++;
        }
        if (aBL) {
            avr += fBL.xyz;
            as++;
        }
        if (aBR) {
            avr += fBR.xyz;
            as++;
        }

        avr = vec3(avr.x / float(as), avr.y / float(as), avr.z / float(as));

        if (!aTL)
            fTL = vec4(avr, 0);
        if (!aTR)
            fTR = vec4(avr, 0);
        if (!aBL)
            fBL = vec4(avr, 0);
        if (!aBR)
            fBR = vec4(avr, 0);

        vec2 posIn = texPos - corPos;

        vec4 mixT = mix(fTL, fTR, posIn.x);
        vec4 mixB = mix(fBL, fBR, posIn.x);

        texFrag = mix(mixT, mixB, posIn.y);
    } else
        texFrag = getTexFrag(texPos);

    outColor = texFrag * oColor;
    outColor.a *= oAlpha;
    outColor = vec4(outColor.rgb * outColor.a, outColor.a);
    if (oBlending == 1)
        outColor = vec4(outColor.rgb * outColor.a, 0.0);
}
`;

const QUAD_VERT_SOURCE = `#version 300 es

in vec2 aPos;

uniform mat3 uView;
uniform mat3 uModel;

uniform vec4 uColor;

out vec4 oColor;

void main() {
    oColor = uColor;

    gl_Position = vec4(uView * uModel * vec3(aPos, 1), 1);
}
`;

const QUAD_FRAG_SOURCE = `#version 300 es

precision highp float;

out vec4 outColor;

in vec4 oColor;

void main() {
    outColor = oColor;
}
`;

// Changing FLOATs to SHORTs; 411.5 KiB -> 320 KiB
const attributes = {
    ["aPos"]: ArrayType.FLOAT2,
    ["aCol"]: ArrayType.SHORT,
    ["aFlags"]: ArrayType.SHORT,
    ["aHsv"]: ArrayType.SHORT,
    ["_0"]: ArrayType.SHORT,
    ["aTex"]: ArrayType.FLOAT2,
    ["aGroups"]: ArrayType.SHORT4,
    ["aSCp"]: ArrayType.SHORT4
};

const GROUP_STATE_TEXTURE_WIDTH = 512;
const FLOATS_PER_GROUP_STATE = 4;

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

    lastGroupId: number = 0;
    lastHSVId: number = 0;

    colorInfoTexture: WebGLTexture;
    groupStateTexture: WebGLTexture;
    objectHSVTexture: WebGLTexture;

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

        this.quadShader = new ShaderProgram(gl);
        this.quadShader.loadShader(gl.VERTEX_SHADER,   QUAD_VERT_SOURCE);
        this.quadShader.loadShader(gl.FRAGMENT_SHADER, QUAD_FRAG_SOURCE);
        this.quadShader.link();

        this.quad = new BufferArray(gl);
        this.quad.add(
            this.quadShader.attrib('aPos'),
            new BufferObject(gl, QUAD_VERTICES),
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
            buffer[+id * fpgs + 0] = state.active ? state.opacity : 0;
            buffer[+id * fpgs + 1] = state.offset.x;
            buffer[+id * fpgs + 2] = state.offset.y;
        }

        this.updateFloatInfoTexture(buffer, this.groupStateTexture, GROUP_STATE_TEXTURE_WIDTH);
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

    updateHSVObjectTexture() {
        const bpoh = BYTES_PER_OBJECT_HSV;

        const size = Math.ceil(bpoh / 4) * (this.lastHSVId + 1);
        let buffer = new Uint8Array(size * 4);

        for (let i = 0; i < buffer.length; i++)
            buffer[i] = 0;

        for (let [id, hsv] of Object.entries(this.objectHSVs)) {
            const idx = +id * bpoh;

            const hueNeg = (hsv.hue < 0) ? 1 : 0;

            const flags = (hueNeg << 7) | (+hsv.saturationAddition << 6) | (+hsv.valueAddition << 5);

            buffer[idx + 0] = Math.abs(hsv.hue);
            buffer[idx + 1] = hsv.saturationAddition ? (Math.abs(hsv.saturation) + 128 * +(hsv.saturation < 0)) : hsv.saturation * 127;
            buffer[idx + 2] = hsv.valueAddition ? (Math.abs(hsv.value) + 128 * +(hsv.value < 0)) : hsv.value * 127;
            buffer[idx + 3] = flags;
        }

        this.updateInfoTexture(buffer, this.objectHSVTexture, OBJECT_HSV_TEXTURE_WIDTH);
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

    genQuadStructs(m: Mat3, c: number, sprite: SpriteCropInfo, groups: number[] = [0, 0, 0, 0], hsvId: number, black: boolean): any {
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

        const crop = sprite.crop;

        let t_l = crop.x,
            t_r = crop.x + crop.w,
            t_t = crop.y,
            t_b = crop.y + crop.h;

        let t: Vec2[];
        
        if (sprite.rotated) {
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

        aFlags |= sprite.sheet == 2 ? 1 : 0;
        aFlags |= black ? 2 : 0;

        for (let i = 0; i < q.length; i++) {
            r.push({
                aPos: m.transform(q[i]).buffer(),
                aCol: c,
                aFlags,
                aTex: t[i].buffer(),
                aGroups: groups,
                aHsv: hsvId,
                aSCp
            });
        }

        return r;
    }

    genQuad(m: Mat3, c: number, sprite: SpriteCropInfo): number[] {
        let r = [];

        let q = [
            new Vec2( -0.5, -0.5 ),
            new Vec2( -0.5,  0.5 ),
            new Vec2(  0.5,  0.5 ),
            new Vec2(  0.5,  0.5 ),
            new Vec2(  0.5, -0.5 ),
            new Vec2( -0.5, -0.5 )
        ];

        const crop = sprite.crop;

        let t_l = crop.x,
            t_r = crop.x + crop.w,
            t_t = crop.y,
            t_b = crop.y + crop.h;

        let t: Vec2[];
        
        if (sprite.rotated) {
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

        for (let i = 0; i < q.length; i++) {
            r.push(...m.transform(q[i]).buffer());
            r.push(c);
            r.push(...t[i].buffer());
            r.push(t_l, t_t, t_r, t_b);
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

    compileObjects(c: ObjectBatch) {
        const builder = new BufferArrayBuilder(attributes);

        for (let o of c.objects) {
            const quad = this.genQuadStructs(o.model, o.color, o.sprite, o.groups, o.hsvId, o.black);
            for (let a of quad)
                builder.add(a);
        }
        
        return {
            count: c.objects.length * 6,
            array: builder.compile(this.gl, this.program)
        };
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

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    render(c: ObjectBatch) {
        let gl = this.gl;

        this.program.use();
        c.buffer.array.use();

        this.updateColorInfoTexture();
        this.updateGroupStateTexture();
        this.updateHSVObjectTexture();

        this.program.uInteger('uTexture', 0);
        this.program.uInteger('uSecondTexture', 1);
        this.program.uInteger('uColorInfoTexture', 2);
        this.program.uInteger('uGroupStateTexture', 3);
        this.program.uInteger('uObjectHSVTexture', 4);

        if (c.mainTexture.loaded) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, c.mainTexture.texture);

            if (c.secondTexture && c.secondTexture.loaded) {
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, c.secondTexture.texture);
            }
            
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, this.colorInfoTexture);
            
            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, this.groupStateTexture);
            
            gl.activeTexture(gl.TEXTURE4);
            gl.bindTexture(gl.TEXTURE_2D, this.objectHSVTexture);

            gl.drawArrays(gl.TRIANGLES, 0, c.buffer.count);
        }
    }
}