"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoveTrigger = exports.MoveTriggerValue = void 0;
const easing_1 = require("../../util/easing");
const vec2_1 = require("../../util/vec2");
const object_1 = require("../object");
const value_trigger_1 = require("./value-trigger");
class MoveTriggerValue extends value_trigger_1.TriggerValue {
    constructor(offset) {
        super();
        this.offset = offset;
    }
}
exports.MoveTriggerValue = MoveTriggerValue;
class MoveTrigger extends value_trigger_1.ValueTrigger {
    applyData(data) {
        super.applyData(data);
        this.moveX = object_1.GDObject.parse(data[28], 'number', 0);
        this.moveY = object_1.GDObject.parse(data[29], 'number', 0);
        this.lockToPlayerX = object_1.GDObject.parse(data[58], 'boolean', 0);
        this.lockToPlayerY = object_1.GDObject.parse(data[59], 'boolean', 0);
        this.easing = object_1.GDObject.parse(data[30], 'number', easing_1.EasingStyle.NONE);
        this.targetGroupId = object_1.GDObject.parse(data[51], 'number', 0);
        this.duration = object_1.GDObject.parse(data[10], 'number', 0);
    }
    shouldUseDeltaPos() {
        return this.lockToPlayerX;
    }
    valueAfterDeltaPos(startValue, deltaPos) {
        let startOffset = new vec2_1.Vec2(0, 0);
        if (startValue instanceof MoveTriggerValue)
            startOffset = startValue.offset;
        let offset = new vec2_1.Vec2(deltaPos, 0);
        return new MoveTriggerValue(startOffset.add(offset));
    }
    valueAfterDelta(startValue, deltaTime) {
        let startOffset = new vec2_1.Vec2(0, 0);
        if (startValue instanceof MoveTriggerValue)
            startOffset = startValue.offset;
        const time = deltaTime / this.duration;
        let offset = new vec2_1.Vec2(0, 0);
        if (isNaN(time) || time >= 1)
            offset = new vec2_1.Vec2(this.moveX, this.moveY);
        else {
            // TODO: Implement easing rate
            const easingOffset = (0, easing_1.easingFunction)(time, this.easing);
            offset = new vec2_1.Vec2(easingOffset * this.moveX, easingOffset * this.moveY);
        }
        return new MoveTriggerValue(startOffset.add(offset));
    }
    getDuration() {
        return this.duration;
    }
    static isOfType(id) {
        return id == 901;
    }
}
exports.MoveTrigger = MoveTrigger;
