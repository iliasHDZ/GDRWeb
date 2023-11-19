import { Color } from "../util/color";
import { HSVShift } from "../util/hsvshift";

export abstract class PulseEntry {
    public intensity: number;
    public baseOnly: boolean;
    public detailOnly: boolean;

    constructor(intensity: number, baseOnly: boolean, detailOnly: boolean) {
        this.intensity  = intensity;
        this.baseOnly   = baseOnly;
        this.detailOnly = detailOnly;
    }

    protected abstract applyToColorRaw(color: Color): Color;

    public applyToColor(color: Color): Color {
        if (this.intensity == 0)
            return color;

        const fullColor = this.applyToColorRaw(color);
        fullColor.a = color.a;

        if (this.intensity == 1)
            return fullColor;

        return color.blend(fullColor, this.intensity);
    }
}

export class PulseColorEntry extends PulseEntry {
    public color: Color;

    constructor(color: Color, intensity: number, baseOnly: boolean, detailOnly: boolean) {
        super(intensity, baseOnly, detailOnly);
        this.color = color;
    }

    protected applyToColorRaw(_: Color): Color {
        return this.color;
    }
}

export class PulseHSVEntry extends PulseEntry {
    public hsv: HSVShift;

    constructor(hsv: HSVShift, intensity: number, baseOnly: boolean, detailOnly: boolean) {
        super(intensity, baseOnly, detailOnly);
        this.hsv = hsv;
    }

    protected applyToColorRaw(color: Color): Color {
        return this.hsv.shiftColor(color);
    }
}