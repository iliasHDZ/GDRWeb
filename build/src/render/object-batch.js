"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectBatch = void 0;
const texture_object_1 = require("./texture-object");
class ObjectBatch {
    constructor(ctx, mainTexture, secondTexture = null) {
        this.objects = [];
        this.mainTexture = mainTexture;
        this.secondTexture = secondTexture;
        this.ctx = ctx;
    }
    add(model, color, sprite, groups, hsvId) {
        this.objects.push(new texture_object_1.TextureObject(model, color, sprite, groups, hsvId));
    }
    compile() {
        this.buffer = this.ctx.compileObjects(this);
    }
}
exports.ObjectBatch = ObjectBatch;
