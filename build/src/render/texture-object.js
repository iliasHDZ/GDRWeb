"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextureObject = void 0;
class TextureObject {
    constructor(model, color, sprite, groups, hsvId, secondTexture = false) {
        this.model = model;
        this.color = color;
        this.sprite = sprite;
        this.groups = groups;
        this.hsvId = hsvId;
        // Is this value even used?
        this.secondTexture = secondTexture;
    }
}
exports.TextureObject = TextureObject;
