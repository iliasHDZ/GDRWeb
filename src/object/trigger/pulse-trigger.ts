import { PulseColorEntry, PulseEntry, PulseHSVEntry } from "../../pulse/pulse-entry";
import { PulseList } from "../../pulse/pulse-list";
import { Color } from "../../util/color";
import { HSVShift } from "../../util/hsvshift";
import { Util } from "../../util/util";
import { GameObject, ObjectProperties, ObjectPropertyReader } from "../object";
import { TriggerValue, ValueTrigger } from "./value-trigger";

export class PulseTriggerValue extends TriggerValue {
    public pulseList: PulseList | null = null;
    public pulseEntry: PulseEntry | null = null;

    constructor(pulseEntry: PulseEntry | null) {
        super();
        this.pulseEntry = pulseEntry;
    }

    static default(): PulseTriggerValue {
        return new PulseTriggerValue(null);
    }

    toPulseList(): PulseList {
        let list = this.pulseList;
        if (list == null)
            list = new PulseList();

        if (this.pulseEntry != null)
            list.add(this.pulseEntry);

        return list;
    }

    applyToColor(color: Color): Color {
        if (this.pulseList != null)
            color = this.pulseList.applyToColor(color);

        if (this.pulseEntry != null)
            color = this.pulseEntry.applyToColor(color);

        return color;
    }

    combineWith(value: TriggerValue): TriggerValue | null {
        if (!(value instanceof PulseTriggerValue))
            return null;

        let res = PulseTriggerValue.default();

        if (this.pulseList != null)
            res.pulseList = this.pulseList;
        else
            res.pulseList = new PulseList();

        if (this.pulseEntry != null)
            res.pulseList.add(this.pulseEntry);

        if (value.pulseList != null)
            res.pulseList.addList(value.pulseList);

        if (value.pulseEntry != null)
            res.pulseList.add(value.pulseEntry);

        return res;
    }
};

export enum PulseMode {
    COLOR,
    HSV
};

export enum PulseTargetType {
    CHANNEL,
    GROUP
};

export class PulseTrigger extends ValueTrigger {
    r: number = 255;
    g: number = 255;
    b: number = 255;

    pulseMode: PulseMode = PulseMode.HSV;
    targetType: PulseTargetType = PulseTargetType.GROUP;

    fadeIn: number  = 0;
    hold: number    = 0;
    fadeOut: number = 0;

    pulseHsv: HSVShift = new HSVShift();

    /*
    Target Color Channel ID when targetType = PulseTargetType.CHANNEL
    Target Group ID         when targetType = PulseTargetType.GROUP
    */
    targetId: number = 0;

    baseOnly: boolean = false;
    detailOnly: boolean = false;

    duration: number = 0;

    applyProperties(rd: ObjectPropertyReader) {
        super.applyProperties(rd);

        this.r = rd.number(7, 255);
        this.g = rd.number(8, 255);
        this.b = rd.number(9, 255);

        this.duration = rd.number(10, 0);

        this.fadeIn  = rd.number(45, 0);
        this.hold    = rd.number(46, 0);
        this.fadeOut = rd.number(47, 0);

        this.pulseMode  = rd.bool(48, false) ? PulseMode.HSV : PulseMode.COLOR;
        this.targetType = rd.bool(52, false) ? PulseTargetType.GROUP : PulseTargetType.CHANNEL;

        this.pulseHsv = rd.hsvShift(49);
        
        this.baseOnly   = rd.bool(65, false);
        this.detailOnly = rd.bool(66, false);

        this.targetId = rd.number(51, 0);
    }

    getTriggerTrackId(): number {
        return this.targetId;
    }

    intensityAt(deltaTime: number): number {
        if (deltaTime < 0 || deltaTime > this.getDuration())
            return 0;

        if (deltaTime < this.fadeIn)
            return deltaTime / this.fadeIn;

        if (deltaTime < (this.fadeIn + this.hold))
            return 1;

        return 1 - (deltaTime - this.fadeIn - this.hold) / this.fadeOut;
    }

    getPulseEntryAt(deltaTime: number): PulseEntry | null {
        const intensity = this.intensityAt(deltaTime);
        if (intensity == 0)
            return null;

        if (this.pulseMode == PulseMode.COLOR)
            return new PulseColorEntry(Color.fromRGBA(this.r, this.g, this.b, 255), intensity, this.baseOnly, this.detailOnly);

        return new PulseHSVEntry(this.pulseHsv, intensity, this.baseOnly, this.detailOnly);
    }

    public valueAfterDelta(_1: TriggerValue, deltaTime: number, _2: number): TriggerValue {
        if (deltaTime >= this.getDuration())
            return PulseTriggerValue.default();

        const entry = this.getPulseEntryAt(deltaTime);

        if (entry != null)
            return new PulseTriggerValue(entry);
        else
            return PulseTriggerValue.default();
    }

    public getDuration(): number {
        return this.fadeIn + this.hold + this.fadeOut;
    }

    static isOfType(id: number): boolean {
        return id == 1006;
    }
}