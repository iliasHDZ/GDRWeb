import { GDLevel } from '../level';
import { GDColor } from './gdcolor';
import { Color } from './color';
export declare class PlayerColor extends GDColor {
    plrcol: number;
    constructor(plrcol: number, opacity: number, blending: boolean);
    evaluate(level: GDLevel, time: number): [Color, boolean];
}
