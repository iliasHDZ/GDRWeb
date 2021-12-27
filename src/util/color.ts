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
        let o = 1 - a;

        return new Color(
            o * this.r + a * c.r,
            o * this.g + a * c.g,
            o * this.b + a * c.b,
            o * this.a + a * c.a
        );
    }

    buffer() {
        return [this.r, this.g, this.b, this.a];
    }
}