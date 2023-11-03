import { GDLevel } from '../level';
import { GDColor } from './gdcolor';
import { Color } from './color';
import { BaseColor } from './basecolor';

export class MixedColor extends GDColor {
    public col1: GDColor;
    public col2: GDColor;
    
    public mix: number;

    constructor(col1: GDColor, col2: GDColor, mix: number) {
        super();

        this.col1 = col1;
        this.col2 = col2;
    }

    evaluate(level: GDLevel): [Color, boolean] {
        return [
            this.col1.evaluate(level)[0].blend(this.col2.evaluate(level)[0], this.mix),
            this.col1.blending
        ];
    }
    
    static mix(col1: GDColor, col2: GDColor, mix: number): GDColor {
        if (col1 instanceof BaseColor && col2 instanceof BaseColor)
            return BaseColor.fromColor(col1.evaluate(null)[0].blend(col2.evaluate(null)[0], mix), mix <= 0 ? col1.blending : col2.blending);

        if (mix == 0)
            return col1;

        if (mix == 1)
            return col2;

        return new MixedColor(col1, col2, mix);
    }
}