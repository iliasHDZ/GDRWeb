"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpriteCropInfo = exports.SpriteCrop = void 0;
const vec2_1 = require("./vec2");
function parseVec(str) {
    let split = str.substring(1, str.length - 1).split(',');
    return [split[0], split[1]];
}
class SpriteCrop {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    getSize() {
        return new vec2_1.Vec2(this.w, this.h);
    }
    static fromObjectData(data) {
        return new SpriteCrop(data.x, data.y, data.w, data.h);
    }
    static fromTextureRect(data) {
        let sp = parseVec(data);
        let org = parseVec(sp[0]);
        let size = parseVec(sp[1]);
        return new SpriteCrop(+org[0], +org[1], +size[0], +size[1]);
    }
}
exports.SpriteCrop = SpriteCrop;
class SpriteCropInfo {
    constructor(name, crop, size, offset, rotated) {
        this.name = name;
        this.crop = crop;
        this.size = size;
        this.offset = offset;
        this.rotated = rotated;
    }
}
exports.SpriteCropInfo = SpriteCropInfo;
