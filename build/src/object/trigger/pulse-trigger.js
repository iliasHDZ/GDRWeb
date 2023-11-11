"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PulseTrigger = exports.PulseTargetType = exports.PulseMode = exports.PulseTriggerValue = void 0;
const color_1 = require("../../util/color");
const hsvshift_1 = require("../../util/hsvshift");
const util_1 = require("../../util/util");
const object_1 = require("../object");
const value_trigger_1 = require("./value-trigger");
class PulseTriggerValue extends value_trigger_1.TriggerValue {
    constructor(color, hsvShift) {
        super();
        this.color = color;
        this.hsvShift = hsvShift;
    }
    static fromColor(color) {
        return new PulseTriggerValue(color, new hsvshift_1.HSVShift());
    }
    static fromHSVShift(hsv) {
        return new PulseTriggerValue(new color_1.Color(0, 0, 0, 0), hsv);
    }
    static empty() {
        return new PulseTriggerValue(new color_1.Color(0, 0, 0, 0), new hsvshift_1.HSVShift());
    }
    isEmpty() {
        return this.color.a == 0 && this.hsvShift.hue == 0 &&
            this.hsvShift.saturation == (this.hsvShift.saturationAddition ? 0 : 1) &&
            this.hsvShift.value == (this.hsvShift.valueAddition ? 0 : 1);
    }
    static blendColor(c1, c2, a) {
        if (c1.a == 0)
            c1 = new color_1.Color(c2.r, c2.g, c2.b, 0);
        if (c2.a == 0)
            c2 = new color_1.Color(c1.r, c1.g, c1.b, 0);
        return c1.blend(c2, a);
    }
    static blendHSV(v1, v2, a) {
        if (v1.isEmpty()) {
            v1 = new hsvshift_1.HSVShift(0, v2.saturationAddition ? 0 : 1, v2.valueAddition ? 0 : 1, v2.saturationAddition, v2.valueAddition);
        }
        if (v2.isEmpty()) {
            v2 = new hsvshift_1.HSVShift(0, v1.saturationAddition ? 0 : 1, v1.valueAddition ? 0 : 1, v1.saturationAddition, v1.valueAddition);
        }
        return new hsvshift_1.HSVShift(util_1.Util.lerp(v1.hue, v2.hue, a), util_1.Util.lerp(v1.saturation, v2.saturation, a), util_1.Util.lerp(v1.value, v2.value, a), v1.saturationAddition, v1.valueAddition);
    }
    blend(val, a) {
        if (this.isEmpty())
            return val.blendToEmpty(1 - a);
        else if (val.isEmpty())
            return this.blendToEmpty(a);
        return new PulseTriggerValue(PulseTriggerValue.blendColor(this.color, val.color, a), PulseTriggerValue.blendHSV(this.hsvShift, val.hsvShift, a));
    }
    blendToEmpty(a) {
        return new PulseTriggerValue(this.color.blend(new color_1.Color(this.color.r, this.color.g, this.color.b, 0), a), new hsvshift_1.HSVShift(util_1.Util.lerp(this.hsvShift.hue, 0, a), util_1.Util.lerp(this.hsvShift.saturation, this.hsvShift.saturationAddition ? 0 : 1, a), util_1.Util.lerp(this.hsvShift.value, this.hsvShift.valueAddition ? 0 : 1, a), this.hsvShift.saturationAddition, this.hsvShift.valueAddition));
    }
    applyToColor(color) {
        let ret = color.blend(new color_1.Color(this.color.r, this.color.g, this.color.b, 1), this.color.a);
        ret.a = color.a;
        return this.hsvShift.shiftColor(ret);
    }
}
exports.PulseTriggerValue = PulseTriggerValue;
;
var PulseMode;
(function (PulseMode) {
    PulseMode[PulseMode["COLOR"] = 0] = "COLOR";
    PulseMode[PulseMode["HSV"] = 1] = "HSV";
})(PulseMode = exports.PulseMode || (exports.PulseMode = {}));
;
var PulseTargetType;
(function (PulseTargetType) {
    PulseTargetType[PulseTargetType["CHANNEL"] = 0] = "CHANNEL";
    PulseTargetType[PulseTargetType["GROUP"] = 1] = "GROUP";
})(PulseTargetType = exports.PulseTargetType || (exports.PulseTargetType = {}));
;
class PulseTrigger extends value_trigger_1.ValueTrigger {
    applyData(data) {
        super.applyData(data);
        this.r = object_1.GDObject.parse(data[7], 'number', 255);
        this.g = object_1.GDObject.parse(data[8], 'number', 255);
        this.b = object_1.GDObject.parse(data[9], 'number', 255);
        this.duration = object_1.GDObject.parse(data[10], 'number', 0);
        this.fadeIn = object_1.GDObject.parse(data[45], 'number', 0);
        this.hold = object_1.GDObject.parse(data[46], 'number', 0);
        this.fadeOut = object_1.GDObject.parse(data[47], 'number', 0);
        this.pulseMode = object_1.GDObject.parse(data[48], 'boolean', false) ? PulseMode.HSV : PulseMode.COLOR;
        this.targetType = object_1.GDObject.parse(data[52], 'boolean', false) ? PulseTargetType.GROUP : PulseTargetType.CHANNEL;
        this.pulseHsv = hsvshift_1.HSVShift.parse(data[49]);
        this.mainOnly = object_1.GDObject.parse(data[65], 'boolean', false);
        this.detailOnly = object_1.GDObject.parse(data[66], 'boolean', false);
        this.targetId = object_1.GDObject.parse(data[51], 'number', 0);
    }
    getTriggerValue() {
        if (this.pulseMode == PulseMode.COLOR)
            return PulseTriggerValue.fromColor(color_1.Color.fromRGBA(this.r, this.g, this.b, 255));
        else
            return PulseTriggerValue.fromHSVShift(this.pulseHsv);
    }
    valueAfterDelta(startValue, deltaTime) {
        if (!(startValue instanceof PulseTriggerValue))
            return PulseTriggerValue.empty();
        if (deltaTime >= this.getDuration())
            return PulseTriggerValue.empty();
        const target = this.getTriggerValue();
        if (deltaTime < this.fadeIn) {
            return startValue.blend(target, deltaTime / this.fadeIn);
        }
        else if (deltaTime < (this.fadeIn + this.hold)) {
            return target;
        }
        else {
            return target.blendToEmpty((deltaTime - this.fadeIn - this.hold) / this.fadeOut);
        }
    }
    getDuration() {
        return this.fadeIn + this.hold + this.fadeOut;
    }
    static isOfType(id) {
        return id == 1006;
    }
}
exports.PulseTrigger = PulseTrigger;
