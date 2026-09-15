import { Level } from ".";
import { ColorChannel } from "./level";
import { GameObject, ObjectPropertyReader } from "./object/object";
import { ColorTrigger } from "./object/trigger/color-trigger";
import { PulseTargetType, PulseTrigger } from "./object/trigger/pulse-trigger";
import { Trigger } from "./object/trigger/trigger";
import { PulseList } from "./pulse/pulse-list";
import { ITriggerTrackList } from "./track/trigger-track";
import { ValueTriggerAction, ValueTriggerTrack, ValueTriggerTrackList } from "./track/value-trigger-track";
import { BaseColor } from "./util/basecolor";
import { Color } from "./util/color";
import { CopyColor } from "./util/copycolor";
import { GDColor } from "./util/gdcolor";
import { HSVShift, hsv2rgb, rgb2hsv } from "./util/hsvshift";
import { PlayerColor } from "./util/playercolor";

interface BlendingStatesSection {
    startTime: number;
    states: { [channel: number]: boolean };
};

function copyBlendingStates(obj: { [channel: number]: boolean }): { [channel: number]: boolean } {
    const ret: { [channel: number]: boolean } = {};
    for (const [k, v] of Object.entries(obj))
        ret[+k] = v;
    return ret;
}

export class ColorManager {
    private colorTrackList: ValueTriggerTrackList<GDColor>;
    private pulseTrackList: ValueTriggerTrackList<PulseList>;

    private level: Level;

    public blendingStates: BlendingStatesSection[] = [];

    constructor(level: Level) {
        this.level = level;

        this.colorTrackList = new ValueTriggerTrackList<GDColor>(level, BaseColor.white());
        this.pulseTrackList = new ValueTriggerTrackList<PulseList>(level, new PulseList());
    }

    public parseStartColor(str: string) {
        if (str == '')
            return;

        let psplit = str.split('_');
        let props: { [_: number]: string } = {};

        for (let p = 0; p < psplit.length; p += 2)
            props[+psplit[p]] = psplit[p + 1];

        const rd = new ObjectPropertyReader(props);

        let r = rd.number(1, 255);
        let g = rd.number(2, 255);
        let b = rd.number(3, 255);

        let plr = rd.number(4, -1);
        let blending = rd.bool(5, false);

        let id = rd.number(6, 1);
        let a = rd.number(7, 1);

        let copyId = rd.number(9, 0);
        let copyOpacity = rd.bool(7, false);
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

    public calculateBlendingStates() {
        const colorActions: ValueTriggerAction<GDColor>[] = [];

        for (const track of Object.values(this.colorTrackList.getTracks()))
            for (const action of track.getActions())
                colorActions.push(action);

        colorActions.sort((a, b) => a.time - b.time);

        const blendingStates: { [channel: number]: boolean } = {};

        for (let i = 1; i < +ColorChannel.COUNT; i++) {
            blendingStates[i] = false;
            const startValue = this.getStartColor(i);
            if (startValue)
                blendingStates[i] = startValue.blending;
        }

        this.blendingStates.push({startTime: -9999999, states: copyBlendingStates(blendingStates)});

        let lastTime: number = -9999999;

        for (const action of colorActions) {
            const trigger = action.trigger as ColorTrigger;

            const isTargetBlending = trigger.target.blending;

            if (blendingStates[trigger.colorChannelId] == isTargetBlending)
                continue;
            blendingStates[trigger.colorChannelId] = isTargetBlending;

            console.log(`Color channel ${trigger.colorChannelId} changes to ${isTargetBlending ? 'blending' : 'normal'} at ${action.time}s`);

            let section: BlendingStatesSection;
            if (action.time > lastTime) {
                section = { startTime: action.time, states: {} };
                this.blendingStates.push(section);
            } else
                section = this.blendingStates[this.blendingStates.length - 1];
            section.states = copyBlendingStates(blendingStates);
            lastTime = action.time;
        }
    }

    public getBlendingStatesIdAtTime(time: number): number {
        for (let i = 0; i < this.blendingStates.length; i++) {
            if (this.blendingStates[i].startTime > time)
                return Math.max(0, i - 1);
        }
        return this.blendingStates.length - 1;
    }

/*
    public updateStopActions(id: number | null = null) {
        this.colorTrackList.updateStopActions(id);
        this.pulseTrackList.updateStopActions(id);
    }
*/

    public setStartColor(channelId: number, color: GDColor) {
        const track = this.colorTrackList.get(channelId);
        if (track) {
            track.startValue = color;
            return;
        }

        this.colorTrackList.createTrackWithStartValue(channelId, color);
    }

    public getStartColor(channelId: number): GDColor | null {
        const track = this.colorTrackList.get(channelId);
        if (track && track.startValue)
            return track.startValue;

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
        return this.colorTrackList.get(ch)?.valueAt(time) ?? BaseColor.white();
    }

    public colorAtTime(ch: number, time: number, iterations: number = 8): [Color, boolean] {
        let color: Color, blending: boolean;
        if (ch == ColorChannel.LBG) {
            [color, blending] = this.getLBG(time);
        } else {
            [color, blending] = this.gdColorAt(ch, time).evaluate(this.level, time, iterations);
        }

        const pulse = this.pulseTrackList.get(ch)?.combinedValueAt(time);
        if (pulse)
            color = pulse.applyToColor(color);

        return [
            color,
            blending
        ];
    }

    public colorAtPos(ch: number, x: number): [Color, boolean] {
        return this.colorAtTime(ch, this.level.timeAt(x));
    }

    public getTrackListForTrigger(trigger: Trigger): ITriggerTrackList | null {
        if (trigger instanceof ColorTrigger)
            return this.colorTrackList;

        if (trigger instanceof PulseTrigger && trigger.targetType == PulseTargetType.CHANNEL)
            return this.pulseTrackList;

        return null;
    }

    public isObjectBlending(object: GameObject): boolean {
        const track = this.colorTrackList.get(object.baseColorChannel);
        if (track == null || !(track instanceof ValueTriggerTrack))
            return false;

        const action = track.lastActionLeftOf(object.x);
        if (action != null) {
            if (!(action.trigger instanceof ColorTrigger))
                return false;

            return action.trigger.target.blending;
        }

        if (!track.startValue)
            return false;

        return track.startValue.blending;
    }
};