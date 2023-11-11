"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vec2 = void 0;
class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(vec) {
        return new Vec2(this.x + vec.x, this.y + vec.y);
    }
    sub(vec) {
        return new Vec2(this.x - vec.x, this.y - vec.y);
    }
    mul(vec) {
        return new Vec2(this.x * vec.x, this.y * vec.y);
    }
    div(vec) {
        return new Vec2(this.x / vec.x, this.y / vec.y);
    }
    neg() {
        return new Vec2(-this.x, -this.y);
    }
    spritePixelsToUnits(spriteQuality) {
        return new Vec2(this.x / spriteQuality * 30, this.y / spriteQuality * 30);
    }
    equals(vec) {
        return this.x == vec.x && this.y == vec.y;
    }
    buffer() {
        return [this.x, this.y];
    }
}
exports.Vec2 = Vec2;
