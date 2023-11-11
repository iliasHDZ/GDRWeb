"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueTrigger = exports.TriggerValue = void 0;
const trigger_1 = require("./trigger");
/*
    The TriggerValue is the abstract object that represent the value that the ValueTrigger changes.
    Read ValueTrigger for more info.
*/
class TriggerValue {
}
exports.TriggerValue = TriggerValue;
/*
    A ValueTrigger is an abstract object that changes a specific value over a duration.
    Examples include: ColorTrigger, PulseTrigger, AlphaTrigger...
*/
class ValueTrigger extends trigger_1.Trigger {
    shouldUseDeltaPos() {
        return false;
    }
    valueAfterDeltaPos(startValue, deltaPos) {
        return new TriggerValue();
    }
}
exports.ValueTrigger = ValueTrigger;
