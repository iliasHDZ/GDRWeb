"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HSVShift = void 0;
const color_1 = require("./color");
const util_1 = require("./util");
// Credits to Kamil Kiełczewski at StackOverflow for the two following functions
function rgb2hsv(r, g, b) {
    let v = Math.max(r, g, b), c = v - Math.min(r, g, b);
    let h = c && ((v == r) ? (g - b) / c : ((v == g) ? 2 + (b - r) / c : 4 + (r - g) / c));
    return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
}
function hsv2rgb(h, s, v) {
    let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    return [f(5), f(3), f(1)];
}
class HSVShift {
    constructor(hue = 0, sat = 1, val = 1, satAdd = false, valAdd = false) {
        this.hue = hue;
        this.saturation = sat;
        this.value = val;
        this.saturationAddition = satAdd;
        this.valueAddition = valAdd;
    }
    equals(hsv) {
        return this.hue == hsv.hue &&
            Math.abs(this.saturation - hsv.saturation) < 0.01 &&
            Math.abs(this.value - hsv.value) < 0.01 &&
            this.saturationAddition == hsv.saturationAddition &&
            this.valueAddition == hsv.valueAddition;
    }
    isEmpty() {
        return this.hue == 0 &&
            this.saturation == (this.saturationAddition ? 0 : 1) &&
            this.value == (this.valueAddition ? 0 : 1);
    }
    static parse(hsvString) {
        if (!hsvString)
            return new HSVShift();
        const split = hsvString.split('a');
        const hue = +split[0];
        const sat = +split[1];
        const val = +split[2];
        const satAdd = +split[3] == 1;
        const valAdd = +split[4] == 1;
        return new HSVShift(hue, sat, val, satAdd, valAdd);
    }
    shiftColor(color) {
        if (this.hue == 0 && this.saturation == 0 && this.value == 0)
            return color;
        let [h, s, v] = rgb2hsv(color.r, color.g, color.b);
        h = (h + this.hue) % 360;
        s = this.saturationAddition ? (s + this.saturation) : (s * this.saturation);
        v = this.valueAddition ? (v + this.value) : (v * this.value);
        s = util_1.Util.clamp(s, 0, 1);
        v = util_1.Util.clamp(v, 0, 1);
        return new color_1.Color(...hsv2rgb(h, s, v), color.a);
    }
    toString() {
        return `HSV(${this.hue.toLocaleString('en-US', { maximumFractionDigits: 3 })}, ${this.saturation.toLocaleString('en-US', { maximumFractionDigits: 3 })}, ${this.value.toLocaleString('en-US', { maximumFractionDigits: 3 })}, ${this.saturationAddition}, ${this.valueAddition})`;
    }
}
exports.HSVShift = HSVShift;
;
