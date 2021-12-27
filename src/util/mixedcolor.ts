import { GDLevel } from '../level';
import { GDColor } from './gdcolor';
import { Color } from './color';

export class MixedColor extends GDColor {
    public col1: GDColor;
    public col2: GDColor;
    
    public mix: number;

    constructor(col1: GDColor, col2: GDColor, mix: number) {
        super();

        this.col1 = col1;
        this.col2 = col2;
    }

    evaluate(level: GDLevel): Color {
        return this.col1.evaluate(level).blend(this.col2.evaluate(level), this.mix);
    }
}