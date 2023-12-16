import { Level } from '../level';
import { Color } from './color';

export abstract class GDColor {
    public opacity:  number;
    public blending: boolean;

    abstract evaluate(level: Level, time: number, iterations: number): [Color, boolean];
}