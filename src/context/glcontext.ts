import { RenderContext } from './context';
import { Color } from './../util/color';
import { ObjectCollection } from '../render/object-collection';
import { ShaderProgram } from './webgl2/program';
import { BufferObject } from './webgl2/buffer';
import { BufferArray } from './webgl2/buffer-array';
import { Mat3 } from '../util/mat3';
import { Vec2 } from '../util/vec2';
import { SpriteCrop } from '../util/spritecrop';

const VERT_SOURCE = `#version 300 es

in vec2 aPos;

in vec2 aTex;
in vec4 aCol;
in vec4 aSCp;

uniform mat3 uView;

out vec2 oTex;
out vec4 oCol;
out vec4 oSCp;

void main() {
    oTex = aTex;
    oCol = aCol;
    oSCp = aSCp;

    gl_Position = vec4(uView * vec3(aPos, 1), 1);
}
`;

const FRAG_SOURCE = `#version 300 es

precision highp float;

out vec4 outColor;

in  vec2 oTex;
in  vec4 oCol;

in  vec4 oSCp;

uniform sampler2D uTexture;

void main() {
    float cor = 0.5;

    vec2 texPos = vec2(max(min(oTex.x, oSCp.z - cor), oSCp.x + cor), max(min(oTex.y, oSCp.w - cor), oSCp.y + cor));

    vec2 texCoords = texPos / vec2(textureSize(uTexture, 0));
    vec4 texFrag   = texture(uTexture, texCoords);

    //outColor = vec4(1.0, 0.5, 0.5, 1.0);

    outColor = vec4(texFrag.xyz / texFrag.w, texFrag.w) * oCol;
    //outColor = texture(uTexture, oTex);
}
`;

export class WebGLContext extends RenderContext {
    gl: WebGL2RenderingContext;
    canvas: HTMLCanvasElement;

    program: ShaderProgram;

    quad: BufferObject;

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

        const quad = [
            -0.5, -0.5,
            -0.5,  0.5,
             0.5,  0.5,
             0.5,  0.5,
             0.5, -0.5,
            -0.5, -0.5
        ];

        this.quad = new BufferObject(gl, quad);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        //gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ZERO);

        this.program = p;
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

    genQuad(m: Mat3, c: Color, s: SpriteCrop): number[] {
        let r = [];

        let q = [
            new Vec2( -0.5, -0.5 ),
            new Vec2( -0.5,  0.5 ),
            new Vec2(  0.5,  0.5 ),
            new Vec2(  0.5,  0.5 ),
            new Vec2(  0.5, -0.5 ),
            new Vec2( -0.5, -0.5 )
        ];

        let t_l = s.x,
            t_r = s.x + s.w,
            t_t = s.y,
            t_b = s.y + s.h;

        let t = [
            new Vec2( t_l, t_b ),
            new Vec2( t_l, t_t ),
            new Vec2( t_r, t_t ),
            new Vec2( t_r, t_t ),
            new Vec2( t_r, t_b ),
            new Vec2( t_l, t_b )
        ];

        for (let i = 0; i < q.length; i++) {
            r.push(...m.transform(q[i]).buffer());
            r.push(...c.buffer());
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

    compileObjects(c: ObjectCollection) {
        let p = this.program;
        let d = [];

        for (let o of c.objects)
            d.push(...this.genQuad(o.model, o.color, o.sprite));
            
        console.log(d);

        const stride = 12 * 4; // [pos_x], [pos_y], [col_r], [col_g], [col_b], [col_a], [tex_u], [tex_v], [scp_l], [scp_t], [scp_r], [scp_b]

        let b = new BufferObject(this.gl, d);
        let a = new BufferArray(this.gl);

        a.add(p.attrib('aPos'), b, 2, 0,     stride);
        a.add(p.attrib('aCol'), b, 4, 2 * 4, stride);
        a.add(p.attrib('aTex'), b, 2, 6 * 4, stride);
        a.add(p.attrib('aSCp'), b, 4, 8 * 4, stride);
        
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
        //a.add(p.attrib('aCol'), b, 4, 13 * 4, stride, 1);

        return {
            ins_count: c.objects.length,
            buffer_array: a
        };*/
    }

    render(c: ObjectCollection) {
        let gl = this.gl;

        this.program.use();
        c.buffer.array.use();

        if (c.texture.loaded) {
            gl.bindTexture(gl.TEXTURE_2D, c.texture.texture);

            gl.drawArrays(gl.TRIANGLES, 0, c.buffer.count);
        }
    }
}