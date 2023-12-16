import { Level } from ".";
import { ColorChannel } from "./level";
import { GameObject } from "./object/object";
import { ColorTrigger, ColorTriggerValue } from "./object/trigger/color-trigger";
import { PulseTargetType, PulseTrigger, PulseTriggerValue } from "./object/trigger/pulse-trigger";
import { Trigger } from "./object/trigger/trigger";
import { TriggerTrackList } from "./track/trigger-track";
import { ValueTriggerTrack, ValueTriggerTrackList } from "./track/value-trigger-track";
import { BaseColor } from "./util/basecolor";
import { Color } from "./util/color";
import { CopyColor } from "./util/copycolor";
import { GDColor } from "./util/gdcolor";
import { HSVShift, hsv2rgb, rgb2hsv } from "./util/hsvshift";
import { PlayerColor } from "./util/playercolor";

export class ColorManager {
    private colorTrackList: ValueTriggerTrackList;
    private pulseTrackList: ValueTriggerTrackList;

    private level: Level;

    constructor(level: Level) {
        this.level = level;

        this.colorTrackList = new ValueTriggerTrackList(level, ColorTriggerValue.default());
        this.pulseTrackList = new ValueTriggerTrackList(level, PulseTriggerValue.default());
    }

    public parseStartColor(str: string) {
        if (str == '')
            return;

        let psplit = str.split('_');
        let props  = {};

        for (let p = 0; p < psplit.length; p += 2)
            props[+psplit[p]] = psplit[p + 1];

        let r = GameObject.parse(props[1], 'number', 255);
        let g = GameObject.parse(props[2], 'number', 255);
        let b = GameObject.parse(props[3], 'number', 255);

        let plr = GameObject.parse(props[4], 'number', -1);
        let blending = GameObject.parse(props[5], 'boolean', false);

        let id = GameObject.parse(props[6], 'number', 1);
        let a = GameObject.parse(props[7], 'number', 1);

        let copyId = GameObject.parse(props[9], 'number', 0);
        let copyOpacity = GameObject.parse(props[17], 'boolean', 0);
        let copyHsvShift = HSVShift.parse(props[10]);

        let color: GDColor;

        if (copyId != 0)
            color = new CopyColor(copyId, copyOpacity, copyHsvShift, a, blending);
        else if (plr != -1)
            color = new PlayerColor(plr - 1, a, blending);
        else
            color = new BaseColor(r, g, b, a, blending);

        this.setStartColor(id, color);
    }

    public updateStopActions(id: number | null = null) {
        this.colorTrackList.updateStopActions(id);
        this.pulseTrackList.updateStopActions(id);
    }

    public setStartColor(channelId: number, color: GDColor) {
        const track = this.colorTrackList.get(channelId);
        if (track)
            track.startValue = new ColorTriggerValue(color);

        this.colorTrackList.createTrackWithStartValue(channelId, new ColorTriggerValue(color));
    }

    public getStartColor(channelId: number): GDColor | null {
        const track = this.colorTrackList.get(channelId);
        if (track && track.startValue instanceof ColorTriggerValue)
            return track.startValue.color;

        return null;
    }

    private getLBG(time: number): [Color, boolean] {
        const [bg] = this.colorAtTime(ColorChannel.BG, time);
        const [p1] = this.colorAtTime(ColorChannel.P1, time);

        let hsv = rgb2hsv(bg.r, bg.g, bg.b);
        hsv[1] = Math.max(hsv[1] - 20, 0);

        const [r, g, b] = hsv2rgb(...hsv);
    
        return [p1.blend(new Color(r, g, b, 1), hsv[2] / 100), true];
    }

    private gdColorAt(ch: number, time: number): GDColor {
        const col = this.colorTrackList.valueAt(ch, time);

        if (!(col instanceof ColorTriggerValue))
            return BaseColor.white();

        return col.color;
    }

    public colorAtTime(ch: number, time: number, iterations: number = 8): [Color, boolean] {
        let color: Color, blending: boolean;
        if (ch == ColorChannel.LBG) {
            [color, blending] = this.getLBG(time);
        } else {
            [color, blending] = this.gdColorAt(ch, time).evaluate(this.level, time, iterations);
        }

        const pulse = this.pulseTrackList.combinedValueAt(ch, time) as PulseTriggerValue;
        color = pulse.applyToColor(color);

        return [
            color,
            blending
        ];
    }

    public colorAtPos(ch: number, x: number): [Color, boolean] {
        return this.colorAtTime(ch, this.level.timeAt(x));
    }

    public getTrackListForTrigger(trigger: Trigger): TriggerTrackList | null {
        if (trigger instanceof ColorTrigger)
            return this.colorTrackList;

        if (trigger instanceof PulseTrigger && trigger.targetType == PulseTargetType.CHANNEL)
            return this.pulseTrackList;

        return null;
    }

    public isObjectBlending(object: GameObject): boolean {
        const track = this.colorTrackList.get(object.baseCol);
        if (track == null || !(track instanceof ValueTriggerTrack))
            return false;

        const exec = track.lastExecutionLeftOf(object.x);
        if (exec != null) {
            if (!(exec.trigger instanceof ColorTrigger))
                return false;

            return exec.trigger.blending;
        }

        if (!(track.startValue instanceof ColorTriggerValue))
            return false;

        return track.startValue.color.blending;
    }
};