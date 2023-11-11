"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Color = void 0;
const util_1 = require("./util");
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
    blend(c, a) {
        a = Math.max(Math.min(a, 1), 0);
        return new Color(util_1.Util.lerp(this.r, c.r, a), util_1.Util.lerp(this.g, c.g, a), util_1.Util.lerp(this.b, c.b, a), util_1.Util.lerp(this.a, c.a, a));
    }
    buffer() {
        return [this.r, this.g, this.b, this.a];
    }
    toString() {
        return `Color(${this.r.toLocaleString('en-US', { maximumFractionDigits: 3 })}, ${this.g.toLocaleString('en-US', { maximumFractionDigits: 3 })}, ${this.b.toLocaleString('en-US', { maximumFractionDigits: 3 })}, ${this.a.toLocaleString('en-US', { maximumFractionDigits: 3 })})`;
    }
}
exports.Color = Color;
