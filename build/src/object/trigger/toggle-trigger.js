"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToggleTrigger = exports.ToggleTriggerValue = void 0;
const object_1 = require("../object");
const value_trigger_1 = require("./value-trigger");
class ToggleTriggerValue extends value_trigger_1.TriggerValue {
    constructor(active) {
        super();
        this.active = active;
    }
}
exports.ToggleTriggerValue = ToggleTriggerValue;
class ToggleTrigger extends value_trigger_1.ValueTrigger {
    applyData(data) {
        super.applyData(data);
        this.activeGroup = object_1.GDObject.parse(data[56], 'boolean', false);
        this.targetGroupId = object_1.GDObject.parse(data[51], 'number', 0);
    }
    valueAfterDelta(_1, _2) {
        return new ToggleTriggerValue(this.activeGroup);
    }
    getDuration() {
        return 0;
    }
    static isOfType(id) {
        return id == 1049;
    }
}
exports.ToggleTrigger = ToggleTrigger;
