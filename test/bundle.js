(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderContext = void 0;
class RenderContext {
}
exports.RenderContext = RenderContext;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebGLContext = void 0;
const context_1 = require("./context");
const program_1 = require("./webgl2/program");
const buffer_1 = require("./webgl2/buffer");
const mat3_1 = require("../util/mat3");
const vec2_1 = require("../util/vec2");
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
class WebGLContext extends context_1.RenderContext {
    constructor(canvas) {
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
        let view = new mat3_1.Mat3();
        let w = this.canvas.width, h = this.canvas.height;
        view.scale(new vec2_1.Vec2(2 / w, 2 / h));
        this.program.uMat3('uView', view);
    }
    init() {
        let gl = this.gl;
        let p = new program_1.ShaderProgram(gl);
        p.shader(gl.VERTEX_SHADER, VERT_SOURCE);
        p.shader(gl.FRAGMENT_SHADER, FRAG_SOURCE);
        p.link();
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ZERO);
        this.program = p;
        this.canvas.addEventListener('resize', () => this.resize());
        this.resize();
    }
    clearColor(c) {
        let gl = this.gl;
        gl.clearColor(c.r, c.g, c.b, c.a);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    genQuad(m, c) {
        let r = [];
        let q = [
            new vec2_1.Vec2(-0.5, -0.5),
            new vec2_1.Vec2(-0.5, 0.5),
            new vec2_1.Vec2(0.5, 0.5),
            new vec2_1.Vec2(0.5, 0.5),
            new vec2_1.Vec2(0.5, -0.5),
            new vec2_1.Vec2(-0.5, -0.5)
        ];
        for (let v of q) {
            r.push(...m.transform(v).buffer());
            r.push(...c.buffer());
        }
        return r;
    }
    compileObjects(c) {
        let p = this.program;
        let d = [];
        let s = 0;
        for (let o of c.objects) {
            s += 6;
            d.push(...this.genQuad(o.model, o.color));
        }
        let b = new buffer_1.VertexBuffer(this.gl, d);
        b.size = s;
        b.attribute(p.attrib('aPos'), 2, 0, 6 * 4);
        b.attribute(p.attrib('aCol'), 4, 2 * 4, 6 * 4);
        return b;
    }
    render(c) {
        let gl = this.gl;
        this.program.use();
        c.buffer.use();
        gl.drawArrays(gl.TRIANGLES, 0, c.buffer.size);
    }
}
exports.WebGLContext = WebGLContext;

},{"../util/mat3":10,"../util/vec2":11,"./context":1,"./webgl2/buffer":3,"./webgl2/program":4}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VertexBuffer = void 0;
class VertexBuffer {
    constructor(gl, data) {
        this.size = 0;
        this.gl = gl;
        this.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        this.vao = gl.createVertexArray();
    }
    attribute(location, size, offset, stride) {
        let gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bindVertexArray(this.vao);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset);
    }
    use() {
        let gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bindVertexArray(this.vao);
    }
}
exports.VertexBuffer = VertexBuffer;

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShaderProgram = void 0;
class ShaderProgram {
    constructor(gl) {
        this.shaders = [];
        this.attribs = {};
        this.uniforms = {};
        this.gl = gl;
    }
    shader(type, source) {
        let gl = this.gl;
        let s = gl.createShader(type);
        gl.shaderSource(s, source);
        gl.compileShader(s);
        if (gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            this.shaders.push(s);
            return;
        }
        let e = new Error(gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        throw e;
    }
    link() {
        let gl = this.gl;
        let prog = gl.createProgram();
        for (let s of this.shaders)
            gl.attachShader(prog, s);
        gl.linkProgram(prog);
        if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            this.program = prog;
            return;
        }
        let e = new Error(gl.getProgramInfoLog(prog));
        gl.deleteProgram(prog);
        throw e;
    }
    attrib(name) {
        if (this.attribs[name])
            return this.attribs[name];
        let l = this.gl.getAttribLocation(this.program, name);
        this.attribs[name] = l;
        return l;
    }
    uniform(name) {
        if (this.uniforms[name])
            return this.uniforms[name];
        let l = this.gl.getUniformLocation(this.program, name);
        this.uniforms[name] = l;
        return l;
    }
    uMat3(name, m) {
        this.gl.uniformMatrix3fv(this.uniform(name), false, new Float32Array(m.buffer()));
    }
    use() {
        this.gl.useProgram(this.program);
    }
}
exports.ShaderProgram = ShaderProgram;

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebGLContext = exports.GDRWebRenderer = void 0;
const renderer_1 = require("./renderer");
Object.defineProperty(exports, "GDRWebRenderer", { enumerable: true, get: function () { return renderer_1.GDRWebRenderer; } });
const glcontext_1 = require("./context/glcontext");
Object.defineProperty(exports, "WebGLContext", { enumerable: true, get: function () { return glcontext_1.WebGLContext; } });

},{"./context/glcontext":2,"./renderer":8}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectCollection = void 0;
const texture_object_1 = require("./texture-object");
class ObjectCollection {
    constructor(ctx) {
        this.objects = [];
        this.ctx = ctx;
    }
    add(model, color) {
        this.objects.push(new texture_object_1.TextureObject(model, color));
    }
    compile() {
        this.buffer = this.ctx.compileObjects(this);
    }
}
exports.ObjectCollection = ObjectCollection;

},{"./texture-object":7}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextureObject = void 0;
class TextureObject {
    constructor(model, color) {
        this.model = model;
        this.color = color;
    }
}
exports.TextureObject = TextureObject;

},{}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GDRWebRenderer = void 0;
const object_collection_1 = require("./render/object-collection");
const color_1 = require("./util/color");
const mat3_1 = require("./util/mat3");
const vec2_1 = require("./util/vec2");
class GDRWebRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.col = new object_collection_1.ObjectCollection(this.ctx);
        for (let i = 0; i < 100; i++) {
            let m = new mat3_1.Mat3();
            m.rotate(Math.random() * 2 * Math.PI);
            m.translate(new vec2_1.Vec2(Math.random() * 400 - 200, Math.random() * 400 - 200));
            m.scale(new vec2_1.Vec2(30, 30));
            this.col.add(m, color_1.Color.fromRGBA(255, 255, 255, 128));
        }
        this.col.compile();
    }
    render() {
        this.ctx.clearColor(color_1.Color.fromRGB(255, 0, 0));
        this.ctx.render(this.col);
    }
}
exports.GDRWebRenderer = GDRWebRenderer;

},{"./render/object-collection":6,"./util/color":9,"./util/mat3":10,"./util/vec2":11}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Color = void 0;
class Color {
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    static fromRGB(r, g, b) {
        return new Color(r / 255, g / 255, b / 255, 1);
    }
    static fromRGBA(r, g, b, a) {
        return new Color(r / 255, g / 255, b / 255, a / 255);
    }
    buffer() {
        return [this.r, this.g, this.b, this.a];
    }
}
exports.Color = Color;

},{}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mat3 = void 0;
class Mat3 {
    constructor() {
        this.d = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    }
    static from(m) {
        let r = new Mat3();
        for (let i = 0; i < 9; i++)
            r.d[i] = m.d[i];
        return r;
    }
    translate(v) {
        let d = this.d, x = v.x, y = v.y;
        let a00 = d[0], a01 = d[1], a02 = d[2], a10 = d[3], a11 = d[4], a12 = d[5], a20 = d[6], a21 = d[7], a22 = d[8];
        d[0] = a00;
        d[1] = a01;
        d[2] = a02;
        d[3] = a10;
        d[4] = a11;
        d[5] = a12;
        d[6] = x * a00 + y * a10 + a20;
        d[7] = x * a01 + y * a11 + a21;
        d[8] = x * a02 + y * a12 + a22;
        this.d = d;
    }
    scale(v) {
        let d = this.d, x = v.x, y = v.y;
        d[0] *= x;
        d[1] *= x;
        d[2] *= x;
        d[3] *= y;
        d[4] *= y;
        d[5] *= y;
        this.d = d;
    }
    rotate(r) {
        let d = this.d, c = Math.cos(r), s = Math.sin(r);
        let a00 = d[0], a01 = d[1], a02 = d[2], a10 = d[3], a11 = d[4], a12 = d[5];
        d[0] = c * a00 + s * a10;
        d[1] = c * a01 + s * a11;
        d[2] = c * a02 + s * a12;
        d[3] = c * a10 - s * a00;
        d[4] = c * a11 - s * a01;
        d[5] = c * a12 - s * a02;
        this.d = d;
    }
    transform(v) {
        let d = this.d, x = v.x, y = v.y;
        v.x = d[0] * x + d[3] * y + d[6];
        v.y = d[1] * x + d[4] * y + d[7];
        return v;
    }
    buffer() {
        return this.d;
    }
}
exports.Mat3 = Mat3;

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vec2 = void 0;
class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    buffer() {
        return [this.x, this.y];
    }
}
exports.Vec2 = Vec2;

},{}],12:[function(require,module,exports){
let {GDRWebRenderer, WebGLContext} = require('../build/main');

window.onload = () => {
    let canvas = document.getElementById('canvas');
    
    let renderer = new GDRWebRenderer(
        new WebGLContext(canvas)
    );

    canvas.onmousemove = (e) => {
        renderer.render();
    }

    renderer.render();
}
},{"../build/main":5}]},{},[12]);
