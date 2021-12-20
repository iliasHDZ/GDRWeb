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
