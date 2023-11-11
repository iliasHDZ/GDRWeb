import { GDLevel } from '../level';
import { GDColor } from './gdcolor';
import { Color } from './color';
export declare class MixedColor extends GDColor {
    col1: GDColor;
    col2: GDColor;
    mix: number;
    constructor(col1: GDColor, col2: GDColor, mix: number);
    evaluate(level: GDLevel, time: number, iterations: number): [Color, boolean];
    static mix(col1: GDColor, col2: GDColor, mix: number): GDColor;
}
