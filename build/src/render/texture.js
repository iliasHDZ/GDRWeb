"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Texture = void 0;
class Texture {
    constructor(ctx) {
        this.loaded = false;
        this.onload = null;
        this.ctx = ctx;
    }
    load(path) {
        let img = new Image();
        let tex = this;
        img.src = path;
        img.onload = () => {
            tex.texture = tex.ctx.loadTexture(img);
            tex.width = img.width;
            tex.height = img.height;
            tex.loaded = true;
            if (tex.onload)
                tex.onload();
        };
    }
}
exports.Texture = Texture;
