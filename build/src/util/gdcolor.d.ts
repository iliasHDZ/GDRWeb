import { GDLevel } from '../level';
import { Color } from './color';
export declare abstract class GDColor {
    opacity: number;
    blending: boolean;
    abstract evaluate(level: GDLevel, time: number, iterations: number): [Color, boolean];
}
