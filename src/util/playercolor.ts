import { GDLevel } from '../level';
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

    evaluate(level: GDLevel): [Color, boolean] {
        return [level.getPlayerColor(this.plrcol, this.opacity), this.blending];
    }
}