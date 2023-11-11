"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorTrigger = exports.ColorTriggerValue = void 0;
const basecolor_1 = require("../../util/basecolor");
const copycolor_1 = require("../../util/copycolor");
const hsvshift_1 = require("../../util/hsvshift");
const mixedcolor_1 = require("../../util/mixedcolor");
const playercolor_1 = require("../../util/playercolor");
const object_1 = require("../object");
const value_trigger_1 = require("./value-trigger");
class ColorTriggerValue extends value_trigger_1.TriggerValue {
    constructor(color) {
        super();
        this.color = color;
    }
    static default() {
        return new ColorTriggerValue(basecolor_1.BaseColor.white());
    }
}
exports.ColorTriggerValue = ColorTriggerValue;
;
class ColorTrigger extends value_trigger_1.ValueTrigger {
    applyData(data) {
        super.applyData(data);
        this.r = object_1.GDObject.parse(data[7], 'number', 255);
        this.g = object_1.GDObject.parse(data[8], 'number', 255);
        this.b = object_1.GDObject.parse(data[9], 'number', 255);
        this.duration = object_1.GDObject.parse(data[10], 'number', 0);
        this.blending = object_1.GDObject.parse(data[17], 'boolean', false);
        this.opacity = object_1.GDObject.parse(data[35], 'number', 1);
        this.plrcol1 = object_1.GDObject.parse(data[15], 'boolean', false);
        this.plrcol2 = object_1.GDObject.parse(data[16], 'boolean', false);
        this.copyId = object_1.GDObject.parse(data[50], 'number', 0);
        this.copyOpacity = object_1.GDObject.parse(data[60], 'boolean', false);
        this.copyHsvShift = hsvshift_1.HSVShift.parse(data[49]);
        if (data[23])
            this.color = +data[23];
        else {
            let color = 1;
            switch (this.id) {
                case 29:
                    color = 1000;
                    break;
                case 30:
                    color = 1001;
                    break;
                case 104:
                    color = 1002;
                    break;
                case 105:
                    color = 1004;
                    break;
                case 221:
                    color = 1;
                    break;
                case 717:
                    color = 2;
                    break;
                case 718:
                    color = 3;
                    break;
                case 743:
                    color = 4;
                    break;
                case 744:
                    color = 1003;
                    break;
            }
            this.color = color;
        }
    }
    getColor() {
        if (this.copyId != 0)
            return new copycolor_1.CopyColor(this.copyId, this.copyOpacity, this.copyHsvShift, this.opacity, this.blending);
        if (this.plrcol1 || this.plrcol2)
            return new playercolor_1.PlayerColor(this.plrcol1 ? 0 : 1, this.opacity, this.blending);
        return new basecolor_1.BaseColor(this.r, this.g, this.b, this.opacity, this.blending);
    }
    valueAfterDelta(startValue, deltaTime) {
        let startCol = new basecolor_1.BaseColor(255, 255, 255, 1, false);
        if (startValue instanceof ColorTriggerValue)
            startCol = startValue.color;
        const endCol = this.getColor();
        if (deltaTime >= this.duration)
            return new ColorTriggerValue(endCol);
        return new ColorTriggerValue(mixedcolor_1.MixedColor.mix(startCol, endCol, deltaTime / this.duration));
    }
    getDuration() {
        return this.duration;
    }
    static isOfType(id) {
        return id == 29 ||
            id == 30 ||
            id == 104 ||
            id == 105 ||
            id == 221 ||
            id == 717 ||
            id == 718 ||
            id == 743 ||
            id == 744 ||
            id == 899 ||
            id == 900 ||
            id == 915;
    }
}
exports.ColorTrigger = ColorTrigger;
