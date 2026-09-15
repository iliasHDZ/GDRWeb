import { BaseColor } from "../../util/basecolor";
import { CopyColor } from "../../util/copycolor";
import { GDColor } from "../../util/gdcolor";
import { MixedColor } from "../../util/mixedcolor";
import { PlayerColor } from "../../util/playercolor";
import { ObjectPropertyReader } from "../object";
import { ValueTrigger } from "./value-trigger";

const COLOR_TRIGGER_IDS: { [id: number]: number } = {
    [29]:  1000,
    [30]:  1001,
    [104]: 1002,
    [105]: 1004,
    [221]: 1,
    [717]: 2,
    [718]: 3,
    [743]: 4,
    [744]: 1003,
    [899]: 1,
    [900]: 1,
    [915]: 1,
};

export class ColorTrigger extends ValueTrigger<GDColor> {
    target: GDColor = BaseColor.white();

    colorChannelId: number = 1;

    duration: number = 0;

    applyProperties(rd: ObjectPropertyReader) {
        super.applyProperties(rd);

        this.duration = rd.number(10, 0);

        const r = rd.number(7, 255);
        const g = rd.number(8, 255);
        const b = rd.number(9, 255);

        const blending = rd.bool(17, false);
        const opacity  = rd.number(35, 1);

        const plrcol1 = rd.bool(15, false);
        const plrcol2 = rd.bool(16, false);

        const copyId = rd.number(50, 0);
        const copyOpacity  = rd.bool(60, false);
        const copyHsvShift = rd.hsvShift(49);

        if (copyId != 0)
            this.target = new CopyColor(copyId, copyOpacity, copyHsvShift, opacity, blending);
        else if (plrcol1 || plrcol2)
            this.target = new PlayerColor(plrcol1 ? 0 : 1, opacity, blending);
        else
            this.target = new BaseColor(r, g, b, opacity, blending);

        if (rd.has(23))
            this.colorChannelId = rd.number(23, 1);
        else
            this.colorChannelId = COLOR_TRIGGER_IDS[this.id] ?? 1;
    }

    public override getTriggerTrackId(): number {
        return this.colorChannelId;
    }

    public override isTrackIdGroupId(): boolean {
        return false;
    }

    public override valueAfterDelta(startColor: GDColor, deltaTime: number, _: number): GDColor {
        if (deltaTime >= this.duration)
            return this.target;

        return MixedColor.mix(startColor, this.target, deltaTime / this.duration);
    }

    public override getDuration(): number {
        return this.duration;
    }

    static isOfType(id: number): boolean {
        return typeof(COLOR_TRIGGER_IDS[id]) == 'number';
    }
}