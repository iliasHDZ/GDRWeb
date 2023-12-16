import { Level } from '../level';
import { GDColor } from './gdcolor';
import { Color } from './color';
import { HSVShift } from './hsvshift';

export class CopyColor extends GDColor {
    public channelId: number;
    public copyOpacity: boolean;
    public hsvShift: HSVShift;

    constructor(channelId: number, copyOpacity: boolean, hsvShift: HSVShift, opacity: number, blending: boolean) {
        super();

        this.channelId = channelId;
        this.copyOpacity = copyOpacity;
        this.hsvShift = hsvShift;

        this.opacity  = opacity;
        this.blending = blending;
    }

    evaluate(level: Level, time: number, iterations: number): [Color, boolean] {
        if (iterations == 0)
            return [new Color(1, 1, 1, 1), false];

        let [color, _] = level.colorManager.colorAtTime(this.channelId, time, iterations - 1);

        if (!this.copyOpacity)
            color.a = this.opacity;

        return [this.hsvShift.shiftColor(color), this.blending];
    }
}