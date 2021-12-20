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
