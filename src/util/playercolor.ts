import { Level } from '../level';
import { GDColor } from './gdcolor';
import { Color } from './color';

export class PlayerColor extends GDColor {
    public plrcol: number;

    constructor(plrcol: number, opacity: number, blending: boolean) {
        super();
        this.plrcol = plrcol;

        this.opacity  = opacity;
        this.blending = blending;
    }

    evaluate(level: Level | null, _: number): [Color, boolean] {
        if (!level)
            return [Color.fromRGB(0, 0, 0), this.blending];
        return [level.getPlayerColor(this.plrcol, this.opacity), this.blending];
    }
}