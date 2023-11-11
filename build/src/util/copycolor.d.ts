import { GDLevel } from '../level';
import { GDColor } from './gdcolor';
import { Color } from './color';
import { HSVShift } from './hsvshift';
export declare class CopyColor extends GDColor {
    channelId: number;
    copyOpacity: boolean;
    hsvShift: HSVShift;
    constructor(channelId: number, copyOpacity: boolean, hsvShift: HSVShift, opacity: number, blending: boolean);
    evaluate(level: GDLevel, time: number, iterations: number): [Color, boolean];
}
