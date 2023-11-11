import { Color } from "./color";
export declare class HSVShift {
    hue: number;
    saturation: number;
    value: number;
    saturationAddition: boolean;
    valueAddition: boolean;
    constructor(hue?: number, sat?: number, val?: number, satAdd?: boolean, valAdd?: boolean);
    equals(hsv: HSVShift): boolean;
    isEmpty(): boolean;
    static parse(hsvString: string | undefined): HSVShift;
    shiftColor(color: Color): Color;
    toString(): string;
}
