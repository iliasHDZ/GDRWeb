import { Color } from "../../util/color";
import { HSVShift } from "../../util/hsvshift";
import { TriggerValue, ValueTrigger } from "./value-trigger";
export declare class PulseTriggerValue extends TriggerValue {
    color: Color;
    hsvShift: HSVShift;
    constructor(color: Color, hsvShift: HSVShift);
    static fromColor(color: Color): PulseTriggerValue;
    static fromHSVShift(hsv: HSVShift): PulseTriggerValue;
    static empty(): PulseTriggerValue;
    isEmpty(): boolean;
    static blendColor(c1: Color, c2: Color, a: number): Color;
    static blendHSV(v1: HSVShift, v2: HSVShift, a: number): HSVShift;
    blend(val: PulseTriggerValue, a: number): PulseTriggerValue;
    blendToEmpty(a: number): PulseTriggerValue;
    applyToColor(color: Color): Color;
}
export declare enum PulseMode {
    COLOR = 0,
    HSV = 1
}
export declare enum PulseTargetType {
    CHANNEL = 0,
    GROUP = 1
}
export declare class PulseTrigger extends ValueTrigger {
    r: number;
    g: number;
    b: number;
    pulseMode: PulseMode;
    targetType: PulseTargetType;
    fadeIn: number;
    hold: number;
    fadeOut: number;
    pulseHsv: HSVShift;
    targetId: number;
    mainOnly: boolean;
    detailOnly: boolean;
    duration: number;
    applyData(data: {}): void;
    getTriggerValue(): PulseTriggerValue;
    valueAfterDelta(startValue: TriggerValue, deltaTime: number): TriggerValue;
    getDuration(): number;
    static isOfType(id: number): boolean;
}
