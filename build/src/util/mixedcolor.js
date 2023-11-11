"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MixedColor = void 0;
const gdcolor_1 = require("./gdcolor");
const basecolor_1 = require("./basecolor");
class MixedColor extends gdcolor_1.GDColor {
    constructor(col1, col2, mix) {
        super();
        this.col1 = col1;
        this.col2 = col2;
    }
    evaluate(level, time, iterations) {
        return [
            this.col1.evaluate(level, time, iterations)[0].blend(this.col2.evaluate(level, time, iterations)[0], this.mix),
            this.col1.blending
        ];
    }
    static mix(col1, col2, mix) {
        if (col1 instanceof basecolor_1.BaseColor && col2 instanceof basecolor_1.BaseColor)
            return basecolor_1.BaseColor.fromColor(col1.evaluate(null, 0)[0].blend(col2.evaluate(null, 0)[0], mix), mix <= 0 ? col1.blending : col2.blending);
        if (mix == 0)
            return col1;
        if (mix == 1)
            return col2;
        return new MixedColor(col1, col2, mix);
    }
}
exports.MixedColor = MixedColor;
