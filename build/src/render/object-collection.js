"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectCollection = void 0;
const texture_object_1 = require("./texture-object");
class ObjectCollection {
    constructor(ctx, mainTexture, secondTexture = null) {
        this.objects = [];
        this.mainTexture = mainTexture;
        this.secondTexture = secondTexture;
        this.ctx = ctx;
    }
    add(model, color, sprite) {
        this.objects.push(new texture_object_1.TextureObject(model, color, sprite));
    }
    compile() {
        this.buffer = this.ctx.compileObjects(this);
    }
}
exports.ObjectCollection = ObjectCollection;
