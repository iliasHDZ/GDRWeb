import { Util } from "./util";

export class Color {
    public r: number;
    public g: number;
    public b: number;
    public a: number;

    constructor(r: number, g: number, b: number, a: number) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    static fromRGB(r: number, g: number, b: number) {
        return new Color(
            r / 255,
            g / 255,
            b / 255,
            1
        );
    }

    static fromRGBA(r: number, g: number, b: number, a: number) {
        return new Color(
            r / 255,
            g / 255,
            b / 255,
            a / 255
        );
    }

    blend(c: Color, a: number) {
        a = Math.max(Math.min(a, 1), 0);

        return new Color(
            Util.lerp(this.r, c.r, a),
            Util.lerp(this.g, c.g, a),
            Util.lerp(this.b, c.b, a),
            Util.lerp(this.a, c.a, a)
        );
    }

    buffer() {
        return [this.r, this.g, this.b, this.a];
    }

    toString(): string {
        return `Color(${this.r.toLocaleString('en-US', {maximumFractionDigits: 3})}, ${this.g.toLocaleString('en-US', {maximumFractionDigits: 3})}, ${this.b.toLocaleString('en-US', {maximumFractionDigits: 3})}, ${this.a.toLocaleString('en-US', {maximumFractionDigits: 3})})`;
    }
}