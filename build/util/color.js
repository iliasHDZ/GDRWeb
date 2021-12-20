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
