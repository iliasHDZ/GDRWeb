"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseColor = void 0;
const gdcolor_1 = require("./gdcolor");
const color_1 = require("./color");
class BaseColor extends gdcolor_1.GDColor {
    constructor(r, g, b, opacity, blending) {
        super();
        this.r = r;
        this.g = g;
        this.b = b;
        this.opacity = opacity;
        this.blending = blending;
    }
    static white() {
        return new BaseColor(255, 255, 255, 1, false);
    }
    static fromColor(color, blending) {
        return new BaseColor(color.r * 255, color.g * 255, color.b * 255, color.a, blending);
    }
    evaluate(level, time) {
        return [color_1.Color.fromRGBA(this.r, this.g, this.b, this.opacity * 255), this.blending];
    }
}
exports.BaseColor = BaseColor;
