"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlphaTrigger = exports.AlphaTriggerValue = void 0;
const util_1 = require("../../util/util");
const object_1 = require("../object");
const value_trigger_1 = require("./value-trigger");
class AlphaTriggerValue extends value_trigger_1.TriggerValue {
    constructor(alpha) {
        super();
        this.alpha = alpha;
    }
}
exports.AlphaTriggerValue = AlphaTriggerValue;
class AlphaTrigger extends value_trigger_1.ValueTrigger {
    applyData(data) {
        super.applyData(data);
        this.duration = object_1.GDObject.parse(data[10], 'number', 0);
        this.alpha = object_1.GDObject.parse(data[35], 'number', 1);
        this.targetGroupId = object_1.GDObject.parse(data[51], 'number', 0);
    }
    valueAfterDelta(startValue, deltaTime) {
        let startAlpha = 1;
        if (startValue instanceof AlphaTriggerValue)
            startAlpha = startValue.alpha;
        if (deltaTime >= this.duration)
            return new AlphaTriggerValue(this.alpha);
        return new AlphaTriggerValue(util_1.Util.lerp(startAlpha, this.alpha, deltaTime / this.duration));
    }
    getDuration() {
        return this.duration;
    }
    static isOfType(id) {
        return id == 1007;
    }
}
exports.AlphaTrigger = AlphaTrigger;
