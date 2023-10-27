import { RenderContext } from './context';
import { Color } from './../util/color';
import { ObjectCollection } from '../render/object-collection';
import { ShaderProgram } from './webgl2/program';
import { BufferObject } from './webgl2/buffer';
import { BufferArray } from './webgl2/buffer-array';
import { ArrayType, BufferArrayBuilder } from './webgl2/buffer-array-builder';
import { Mat3 } from '../util/mat3';
import { Vec2 } from '../util/vec2';
import { SpriteCrop, SpriteInfo } from '../util/sprite';

const VERT_SOURCE = `#version 300 es

in vec2 aPos;
in vec2 aTex;
in vec4 aSCp;

in float aFlags;
in float aCol;

uniform mat3 uView;

out vec2 oTex;
out vec4 oSCp;

out float oCol;

flat out int oFlags;

void main() {
    oTex = aTex;
    oSCp = aSCp;

    oCol = aCol;

    oFlags = int(aFlags);

    gl_Position = vec4(uView * vec3(aPos, 1), 1);
}
`;

const FRAG_SOURCE = `#version 300 es

precision highp float;

out vec4 outColor;

in  vec2 oTex;
in  vec4 oSCp;

in float oCol;

flat in int oFlags;

uniform sampler2D uTexture;
uniform sampler2D uSecondTexture;

uniform vec4 uColors[1011];

vec4 getTexFrag(vec2 pos) {
    vec2 texCoords = pos / vec2(textureSize(uTexture, 0));
    if (oFlags == 1)
        return texture(uSecondTexture, texCoords);
    else
        return texture(uTexture, texCoords);
}

void main() {
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

    vec4 objColor;

    if (int(oCol) == 1010)
        objColor = vec4(0, 0, 0, 1);
    else if (int(oCol) == 1011)
        objColor = vec4(1, 1, 1, 1);
    else
        objColor = uColors[int(oCol)];

    outColor = texFrag * objColor;
}
`;

// Changing FLOATs to SHORTs; 411.5 KiB -> 320 KiB
const attributes = {
    ["aPos"]: ArrayType.FLOAT2,
    ["aCol"]: ArrayType.SHORT,
    ["aFlags"]: ArrayType.SHORT,
    ["aTex"]: ArrayType.FLOAT2,
    ["aSCp"]: ArrayType.SHORT4
};

export class WebGLContext extends RenderContext {
    gl: WebGL2RenderingContext;
    canvas: HTMLCanvasElement;

    program: ShaderProgram;

    quad: BufferObject;

    colors: number[];

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

    setViewMatrix(view: Mat3) {
        this.program.use();
        this.program.uMat3('uView', view);
    }

    init() {
        let gl = this.gl;
        let p  = new ShaderProgram(gl);

        p.loadShader(gl.VERTEX_SHADER,   VERT_SOURCE);
        p.loadShader(gl.FRAGMENT_SHADER, FRAG_SOURCE);

        p.link();

        this.program = p;

        gl.enable(gl.BLEND);
        //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ZERO);

        this.colors = [];

        for (let i = 0; i < 1011 * 4; i++)
            this.colors.push(0);

        /*
        this.texWidth  = 0;
        this.texHeight = 0;
        this.texCount  = 0;

        for (let [k, v] of Object.entries(Renderer.objectData.data)) {
            if (!v) continue;

            let obj = v as GDObjectData;

            if (obj.baseSprite) {
                this.texWidth  = Math.max(this.texWidth,  obj.baseSprite.crop.w);
                this.texHeight = Math.max(this.texHeight, obj.baseSprite.crop.h);
                this.texCount++;
            }

            if (obj.detailSprite) {
                this.texWidth  = Math.max(this.texWidth,  obj.detailSprite.crop.w);
                this.texHeight = Math.max(this.texHeight, obj.detailSprite.crop.h);
                this.texCount++;
            }
        }

        console.log(this.texWidth, this.texHeight, this.texCount);
        */
    }

    setColorChannel(channel: number, color: Color) {
        if (channel < 0 || channel > 1011) return;

        this.colors[channel * 4]     = color.r;
        this.colors[channel * 4 + 1] = color.g;
        this.colors[channel * 4 + 2] = color.b;
        this.colors[channel * 4 + 3] = color.a;
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

    genQuadStructs(m: Mat3, c: number, sprite: SpriteInfo): any {
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

        for (let i = 0; i < q.length; i++) {
            r.push({
                aPos: m.transform(q[i]).buffer(),
                aCol: c,
                aFlags: sprite.sheet == 2 ? 1 : 0,
                aTex: t[i].buffer(),
                aSCp
            });
        }

        return r;
    }

    genQuad(m: Mat3, c: number, sprite: SpriteInfo): number[] {
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

    /* compileObjects(c: ObjectCollection) {
        let p = this.program;
        let d = [];

        for (let o of c.objects)
            d.push(...this.genQuad(o.model, o.color, o.sprite));

        const stride = 9 * 4; // [pos_x], [pos_y], [col_r], [tex_u], [tex_v], [scp_l], [scp_t], [scp_r], [scp_b]

        let b = new BufferObject(this.gl, new Float32Array(d));
        let a = new BufferArray(this.gl);

        a.add(p.attrib('aPos'), b, 2, 0,     stride);
        a.add(p.attrib('aCol'), b, 1, 2 * 4, stride);
        a.add(p.attrib('aTex'), b, 2, 3 * 4, stride);
        a.add(p.attrib('aSCp'), b, 4, 5 * 4, stride);
        
        return {
            count: c.objects.length * 6,
            array: a
        };

        /*let p = this.program;
        let d = [];

        for (let o of c.objects)
            d.push(...this.genInstance(o.model, o.color, o.sprite));

        console.log(d);

        const stride = 9 * 4; // [model_mat] * 9, [tex_x], [tex_y], [tex_w], [tex_h], [col_r], [col_g], [col_b], [col_a]

        let b = new BufferObject(this.gl, d);
        let a = new BufferArray(this.gl);

        a.add(p.attrib("aPos"), this.quad, 2, 0, 2 * 4);

        a.add(p.attrib('aMod'), b, 3, 0,      stride, 1);
        //a.add(p.attrib('aTex'), b, 4, 9 * 4,  stride, 1);
        //a.add(p.attrib('aCol'), b, 4, 003 * 4, stride, 1);

        return {
            ins_count: c.objects.length,
            buffer_array: a
        };
    } */

    compileObjects(c: ObjectCollection) {
        const builder = new BufferArrayBuilder(attributes);

        for (let o of c.objects) {
            const quad = this.genQuadStructs(o.model, o.color, o.sprite)
            for (let a of quad)
                builder.add(a);
        }
        
        return {
            count: c.objects.length * 6,
            array: builder.compile(this.gl, this.program)
        };
    }

    render(c: ObjectCollection) {
        let gl = this.gl;

        this.program.use();
        c.buffer.array.use();

        this.program.uV4('uColors', this.colors);

        this.program.uInteger('uTexture', 0);
        this.program.uInteger('uSecondTexture', 1);

        if (c.mainTexture.loaded) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, c.mainTexture.texture);

            if (c.secondTexture && c.secondTexture.loaded) {
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, c.secondTexture.texture);
            }

            gl.drawArrays(gl.TRIANGLES, 0, c.buffer.count);
        }
    }
}