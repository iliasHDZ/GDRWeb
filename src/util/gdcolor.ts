import { Level } from '../level';
import { Color } from './color';

export abstract class GDColor {
    public opacity:  number  = 1;
    public blending: boolean = false;

    abstract evaluate(level: Level | null, time: number, iterations: number): [Color, boolean];
}