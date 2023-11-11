export declare class Color {
    r: number;
    g: number;
    b: number;
    a: number;
    constructor(r: number, g: number, b: number, a: number);
    static fromRGB(r: number, g: number, b: number): Color;
    static fromRGBA(r: number, g: number, b: number, a: number): Color;
    blend(c: Color, a: number): Color;
    buffer(): number[];
    toString(): string;
}
