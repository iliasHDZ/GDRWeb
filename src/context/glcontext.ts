import { RenderContext } from './context';
import { Color } from './../util/color';
import { ObjectCollection } from '../render/object-collection';
import { ShaderProgram } from './webgl2/program';
import { VertexBuffer } from './webgl2/buffer';
import { Mat3 } from '../util/mat3';
import { Vec2 } from '../util/vec2';
import { SpriteCrop } from '../util/spritecrop';

const VERT_SOURCE = `#version 300 es

in vec2 aPos;
in vec4 aCol;
in vec2 aTex;

uniform mat3 uView;

out vec4 oCol;
out vec2 oTex;

void main() {
    oCol = aCol;
    oTex = aTex;

    gl_Position = vec4(uView * vec3(aPos, 1), 1);
}
`;

const FRAG_SOURCE = `#version 300 es

precision highp float;

out vec4 outColor;

in  vec4 oCol;
in  vec2 oTex;

uniform sampler2D uTexture;

void main() {
    outColor = texture(uTexture, oTex / vec2(textureSize(uTexture, 0))) * oCol;
    //outColor = texture(uTexture, oTex);
}
`;

export class WebGLContext extends RenderContext {
    gl: WebGL2RenderingContext;
    canvas: HTMLCanvasElement;

    program: ShaderProgram;

    constructor(canvas: HTMLCanvasElement) {
        super();

        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2', {
            premultipliedAlpha: false,
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

        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ZERO);

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
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

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
        }

        return r;
    }

    compileObjects(c: ObjectCollection) {
        let p = this.program;
        let d = [];

        let s = 0;

        for (let o of c.objects) {
            s += 6;
            d.push(...this.genQuad(o.model, o.color, o.sprite));
        }

        const stride = 8 * 4; // [pos_x], [pos_y], [col_r], [col_g], [col_b], [col_a], [tex_u], [tex_v]

        let b  = new VertexBuffer(this.gl, d);
        b.size = s;

        b.attribute(p.attrib('aPos'), 2, 0,     stride);
        b.attribute(p.attrib('aCol'), 4, 2 * 4, stride);
        b.attribute(p.attrib('aTex'), 2, 6 * 4, stride);
        
        return b;
    }

    render(c: ObjectCollection) {
        let gl = this.gl;

        this.program.use();
        c.buffer.use();

        if (c.texture.loaded) {
            gl.bindTexture(gl.TEXTURE_2D, c.texture.texture);

            gl.drawArrays(gl.TRIANGLES, 0, c.buffer.size);
        }
    }
}