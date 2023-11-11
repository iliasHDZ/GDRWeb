"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopyColor = void 0;
const gdcolor_1 = require("./gdcolor");
const color_1 = require("./color");
class CopyColor extends gdcolor_1.GDColor {
    constructor(channelId, copyOpacity, hsvShift, opacity, blending) {
        super();
        this.channelId = channelId;
        this.copyOpacity = copyOpacity;
        this.hsvShift = hsvShift;
        this.opacity = opacity;
        this.blending = blending;
    }
    evaluate(level, time, iterations) {
        if (iterations == 0)
            return [new color_1.Color(1, 1, 1, 1), false];
        let [color, _] = level.colorAtTime(this.channelId, time, iterations - 1);
        if (!this.copyOpacity)
            color.a = this.opacity;
        return [this.hsvShift.shiftColor(color), this.blending];
    }
}
exports.CopyColor = CopyColor;
