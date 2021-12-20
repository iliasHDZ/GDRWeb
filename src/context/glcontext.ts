import { RenderContext } from './context';
import { Color } from './../util/color';
import { ObjectCollection } from '../render/object-collection';
import { ShaderProgram } from './webgl2/program';
import { VertexBuffer } from './webgl2/buffer';
import { Mat3 } from '../util/mat3';
import { Vec2 } from '../util/vec2';

const VERT_SOURCE = `#version 300 es

in vec2 aPos;
in vec4 aCol;

uniform mat3 uView;

out vec4 oCol;

void main() {
    oCol = aCol;
    gl_Position = vec4(uView * vec3(aPos, 1), 1);
}
`;

const FRAG_SOURCE = `#version 300 es

precision highp float;

out vec4 outColor;
in vec4 oCol;

void main() {
    outColor = vec4(oCol.xyz, 0.5);
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

    resize() {
        this.program.use();

        let view = new Mat3();
        let w = this.canvas.width, h = this.canvas.height;

        view.scale( new Vec2(2 / w, 2 / h) );

        this.program.uMat3('uView', view);
    }

    init() {
        let gl = this.gl;
        let p  = new ShaderProgram(gl);

        p.shader(gl.VERTEX_SHADER,   VERT_SOURCE);
        p.shader(gl.FRAGMENT_SHADER, FRAG_SOURCE);

        p.link();

        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ZERO);

        this.program = p;

        this.canvas.addEventListener('resize', () => this.resize());
        this.resize();
    }

    clearColor(c: Color) {
        let gl = this.gl;

        gl.clearColor(c.r, c.g, c.b, c.a);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    genQuad(m: Mat3, c: Color): number[] {
        let r = [];

        let q = [
            new Vec2( -0.5, -0.5 ),
            new Vec2( -0.5,  0.5 ),
            new Vec2(  0.5,  0.5 ),
            new Vec2(  0.5,  0.5 ),
            new Vec2(  0.5, -0.5 ),
            new Vec2( -0.5, -0.5 )
        ];

        for (let v of q) {
            r.push(...m.transform(v).buffer());
            r.push(...c.buffer())
        }

        return r;
    }

    compileObjects(c: ObjectCollection) {
        let p = this.program;
        let d = [];

        let s = 0;

        for (let o of c.objects) {
            s += 6;
            d.push(...this.genQuad(o.model, o.color));
        }

        let b  = new VertexBuffer(this.gl, d);
        b.size = s;

        b.attribute(p.attrib('aPos'), 2, 0, 6 * 4);
        b.attribute(p.attrib('aCol'), 4, 2 * 4, 6 * 4);
        
        return b;
    }

    render(c: ObjectCollection) {
        let gl = this.gl;

        this.program.use();
        c.buffer.use();

        gl.drawArrays(gl.TRIANGLES, 0, c.buffer.size);
    }
}