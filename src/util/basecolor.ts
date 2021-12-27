import { GDLevel } from '../level';
import { GDColor } from './gdcolor';
import { Color } from './color';

export class BaseColor extends GDColor {
    public r: number;
    public g: number;
    public b: number;

    constructor(r: number, g: number, b: number, opacity: number, blending: boolean) {
        super();

        this.r = r;
        this.g = g;
        this.b = b;

        this.opacity  = opacity;
        this.blending = blending;
    }

    static fromColor(color: Color, blending: boolean): BaseColor {
        return new BaseColor(color.r * 255, color.g * 255, color.b * 255, color.a, blending);
    }

    evaluate(level: GDLevel): Color {
        return Color.fromRGBA(this.r, this.g, this.b, this.opacity * 255);
    }
}