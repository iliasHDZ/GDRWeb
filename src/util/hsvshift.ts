import { Color } from "./color";
import { Util } from "./util";


// Credits to Kamil Kiełczewski at StackOverflow for the two following functions
export function rgb2hsv(r: number, g: number, b: number): [number, number, number] {
    let v=Math.max(r,g,b), c=v-Math.min(r,g,b);
    let h= c && ((v==r) ? (g-b)/c : ((v==g) ? 2+(b-r)/c : 4+(r-g)/c)); 
    return [60*(h<0?h+6:h), v&&c/v, v];
}

export function hsv2rgb(h: number, s: number, v: number): [number, number, number] {                              
    let f= (n,k=(n+h/60)%6) => v - v*s*Math.max( Math.min(k,4-k,1), 0);     
    return [f(5),f(3),f(1)];
}

export class HSVShift {
    hue: number;
    saturation: number;
    value: number;

    saturationAddition: boolean;
    valueAddition: boolean;

    constructor(hue: number = 0, sat: number = 1, val: number = 1, satAdd: boolean = false, valAdd: boolean = false) {
        this.hue = hue;
        this.saturation = sat;
        this.value = val;

        this.saturationAddition = satAdd;
        this.valueAddition = valAdd;
    }

    equals(hsv: HSVShift): boolean {
        return this.hue == hsv.hue &&
               Math.abs(this.saturation - hsv.saturation) < 0.01 && 
               Math.abs(this.value - hsv.value) < 0.01 &&
               this.saturationAddition == hsv.saturationAddition &&
               this.valueAddition == hsv.valueAddition;
    }

    isEmpty(): boolean {
        return this.hue == 0 &&
            this.saturation == (this.saturationAddition ? 0 : 1) &&
            this.value == (this.valueAddition ? 0 : 1);
    }

    static parse(hsvString: string | undefined): HSVShift {
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

    shiftColor(color: Color): Color {
        if (this.hue == 0 && this.saturation == 0 && this.value == 0)
            return color;

        let [h, s, v] = rgb2hsv(color.r, color.g, color.b);

        h = (h + this.hue) % 360;

        s = this.saturationAddition ? (s + this.saturation) : (s * this.saturation);
        v = this.valueAddition ? (v + this.value) : (v * this.value);

        s = Util.clamp(s, 0, 1);
        v = Util.clamp(v, 0, 1);

        return new Color(...hsv2rgb(h, s, v), color.a);
    }

    toString(): string {
        return `HSV(${this.hue.toLocaleString('en-US', {maximumFractionDigits: 3})}, ${this.saturation.toLocaleString('en-US', {maximumFractionDigits: 3})}, ${this.value.toLocaleString('en-US', {maximumFractionDigits: 3})}, ${this.saturationAddition}, ${this.valueAddition})`;
    }
};