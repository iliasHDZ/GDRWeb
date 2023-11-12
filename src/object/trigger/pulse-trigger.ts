import { Color } from "../../util/color";
import { HSVShift } from "../../util/hsvshift";
import { Util } from "../../util/util";
import { GDObject } from "../object";
import { TriggerValue, ValueTrigger } from "./value-trigger";

export class PulseTriggerValue extends TriggerValue {
    public color: Color;
    public hsvShift: HSVShift;

    constructor(color: Color, hsvShift: HSVShift) {
        super();
        this.color = color;
        this.hsvShift = hsvShift;
    }

    static fromColor(color: Color): PulseTriggerValue {
        return new PulseTriggerValue(color, new HSVShift());
    }

    static fromHSVShift(hsv: HSVShift): PulseTriggerValue {
        return new PulseTriggerValue(new Color(0, 0, 0, 0), hsv);
    }

    static empty(): PulseTriggerValue {
        return new PulseTriggerValue(new Color(0, 0, 0, 0), new HSVShift());
    }

    isEmpty(): boolean {
        return this.color.a == 0 && this.hsvShift.hue == 0 &&
            this.hsvShift.saturation == (this.hsvShift.saturationAddition ? 0 : 1) &&
            this.hsvShift.value == (this.hsvShift.valueAddition ? 0 : 1);
    }

    static blendColor(c1: Color, c2: Color, a: number): Color {
        if (c1.a == 0)
            c1 = new Color(c2.r, c2.g, c2.b, 0);

        if (c2.a == 0)
            c2 = new Color(c1.r, c1.g, c1.b, 0);

        return c1.blend(c2, a);
    }

    static blendHSV(v1: HSVShift, v2: HSVShift, a: number): HSVShift {
        if (v1.isEmpty()) {
            v1 = new HSVShift(
                0,
                v2.saturationAddition ? 0 : 1,
                v2.valueAddition ? 0 : 1,
                v2.saturationAddition,
                v2.valueAddition
            );
        }

        if (v2.isEmpty()) {
            v2 = new HSVShift(
                0,
                v1.saturationAddition ? 0 : 1,
                v1.valueAddition ? 0 : 1,
                v1.saturationAddition,
                v1.valueAddition
            );
        }

        return new HSVShift(
            Util.lerp(v1.hue, v2.hue, a),
            Util.lerp(v1.saturation, v2.saturation, a),
            Util.lerp(v1.value, v2.value, a),
            v1.saturationAddition,
            v1.valueAddition
        );
    }

    blend(val: PulseTriggerValue, a: number): PulseTriggerValue {
        if (this.isEmpty())
            return val.blendToEmpty(1 - a);
        else if (val.isEmpty())
            return this.blendToEmpty(a);

        return new PulseTriggerValue(
            PulseTriggerValue.blendColor(this.color, val.color, a),
            PulseTriggerValue.blendHSV(this.hsvShift, val.hsvShift, a)
        );
    }

    blendToEmpty(a: number): PulseTriggerValue {
        return new PulseTriggerValue(
            this.color.blend(new Color(this.color.r, this.color.g, this.color.b, 0), a),
            new HSVShift(
                Util.lerp(this.hsvShift.hue, 0, a),
                Util.lerp(this.hsvShift.saturation, this.hsvShift.saturationAddition ? 0 : 1, a),
                Util.lerp(this.hsvShift.value, this.hsvShift.valueAddition ? 0 : 1, a),
                this.hsvShift.saturationAddition,
                this.hsvShift.valueAddition
            )
        );
    }

    applyToColor(color: Color): Color {
        let ret = color.blend(new Color(this.color.r, this.color.g, this.color.b, 1), this.color.a);
        ret.a = color.a;

        return this.hsvShift.shiftColor(ret);
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
    r: number;
    g: number;
    b: number;

    pulseMode: PulseMode;
    targetType: PulseTargetType;

    fadeIn: number;
    hold: number;
    fadeOut: number;

    pulseHsv: HSVShift;

    /*
    Target Color Channel ID when targetType = PulseTargetType.CHANNEL
    Target Group ID         when targetType = PulseTargetType.GROUP
    */
    targetId: number;

    mainOnly: boolean;
    detailOnly: boolean;

    duration: number;

    applyData(data: {}) {
        super.applyData(data);

        this.r = GDObject.parse(data[7], 'number', 255);
        this.g = GDObject.parse(data[8], 'number', 255);
        this.b = GDObject.parse(data[9], 'number', 255);

        this.duration = GDObject.parse(data[10], 'number', 0);

        this.fadeIn  = GDObject.parse(data[45], 'number', 0);
        this.hold    = GDObject.parse(data[46], 'number', 0);
        this.fadeOut = GDObject.parse(data[47], 'number', 0);

        this.pulseMode  = GDObject.parse(data[48], 'boolean', false) ? PulseMode.HSV : PulseMode.COLOR;
        this.targetType = GDObject.parse(data[52], 'boolean', false) ? PulseTargetType.GROUP : PulseTargetType.CHANNEL;

        this.pulseHsv = HSVShift.parse(data[49]);
        
        this.mainOnly   = GDObject.parse(data[65], 'boolean', false);
        this.detailOnly = GDObject.parse(data[66], 'boolean', false);

        this.targetId = GDObject.parse(data[51], 'number', 0);
    }

    getTriggerValue(): PulseTriggerValue {
        if (this.pulseMode == PulseMode.COLOR)
            return PulseTriggerValue.fromColor(Color.fromRGBA(this.r, this.g, this.b, 255));
        else
            return PulseTriggerValue.fromHSVShift(this.pulseHsv);
    }

    public valueAfterDelta(startValue: TriggerValue, deltaTime: number, _: number): TriggerValue {
        if (!(startValue instanceof PulseTriggerValue))
            return PulseTriggerValue.empty();

        if (deltaTime >= this.getDuration())
            return PulseTriggerValue.empty();

        const target = this.getTriggerValue();
        
        if (deltaTime < this.fadeIn) {
            return startValue.blend(target, deltaTime / this.fadeIn);
        } else if (deltaTime < (this.fadeIn + this.hold)) {
            return target;
        } else {
            return target.blendToEmpty((deltaTime - this.fadeIn - this.hold) / this.fadeOut);
        }
    }

    public getDuration(): number {
        return this.fadeIn + this.hold + this.fadeOut;
    }

    static isOfType(id: number): boolean {
        return id == 1006;
    }
}