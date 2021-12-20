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
