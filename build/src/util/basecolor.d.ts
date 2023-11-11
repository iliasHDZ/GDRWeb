import { GDLevel } from '../level';
import { GDColor } from './gdcolor';
import { Color } from './color';
export declare class BaseColor extends GDColor {
    r: number;
    g: number;
    b: number;
    constructor(r: number, g: number, b: number, opacity: number, blending: boolean);
    static white(): BaseColor;
    static fromColor(color: Color, blending: boolean): BaseColor;
    evaluate(level: GDLevel, time: number): [Color, boolean];
}
