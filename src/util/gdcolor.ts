import { GDLevel } from '../level';
import { Color } from './color';

export abstract class GDColor {
    public opacity:  number;
    public blending: boolean;

    abstract evaluate(level: GDLevel, time: number, iterations: number): [Color, boolean];
}