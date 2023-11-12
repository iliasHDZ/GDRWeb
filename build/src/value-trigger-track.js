"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueTriggerTrackList = exports.ValueTriggerTrack = void 0;
const _1 = require(".");
const value_trigger_1 = require("./object/trigger/value-trigger");
const util_1 = require("./util/util");
class ValueTriggerExecution {
    constructor(trigger, time, track, stoppedAt = null) {
        this.trigger = trigger;
        this.time = time;
        this.track = track;
        this.stoppedAt = stoppedAt;
    }
    valueAt(start, time) {
        let maxExecutionTime = this.trigger.getDuration();
        if (this.stoppedAt != null)
            maxExecutionTime = Math.min(maxExecutionTime, this.stoppedAt - this.time);
        const deltaTime = util_1.Util.clamp(time - this.time, 0, maxExecutionTime);
        const deltaPos = this.track.level.posAt(this.time + deltaTime) - this.trigger.x;
        if (this.trigger.shouldUseDeltaPos())
            return this.trigger.valueAfterDeltaPos(start, deltaPos);
        else
            return this.trigger.valueAfterDelta(start, deltaTime);
    }
    getEndTime() {
        return this.time + this.trigger.getDuration();
    }
}
class ValueTriggerTrack {
    constructor(startValue, level) {
        this.startValue = startValue;
        this.executions = [];
        this.level = level;
    }
    setStartValue(value) {
        this.startValue = value;
    }
    createTriggerExecution(trigger, time) {
        const stoppedAt = this.level.stopTrackList.triggerStoppedAt(trigger, time);
        return new ValueTriggerExecution(trigger, time, this, stoppedAt);
    }
    insertTrigger(trigger, time) {
        const exec = this.createTriggerExecution(trigger, time);
        for (let i = 0; i < this.executions.length; i++) {
            if (this.executions[i].time > time) {
                this.executions.splice(i, 0, exec);
                return;
            }
        }
        this.executions.push(exec);
    }
    valueAt(time) {
        let value = this.startValue;
        let lastExec = null;
        for (let exec of this.executions) {
            if (exec.time >= time)
                break;
            if (lastExec)
                value = lastExec.valueAt(value, exec.time);
            lastExec = exec;
        }
        if (lastExec)
            return lastExec.valueAt(value, time);
        return value;
    }
    moveValueAt(time) {
        let value = new _1.Vec2(0, 0);
        for (let exec of this.executions) {
            if (exec.time >= time)
                break;
            value = value.add(exec.valueAt(new _1.Vec2(0, 0), time).offset);
        }
        return value;
    }
    layeredValueAt(time) {
        let lastExec = null;
        for (let exec of this.executions) {
            if (exec.time >= time)
                break;
            if (time < exec.getEndTime())
                lastExec = exec;
        }
        if (lastExec == null)
            return this.startValue;
        else
            return lastExec.valueAt(this.layeredValueAt(lastExec.time), time);
    }
}
exports.ValueTriggerTrack = ValueTriggerTrack;
class ValueTriggerTrackList {
    constructor(level, defaultStartValue) {
        this.tracks = {};
        this.defaultStartValue = defaultStartValue;
        this.level = level;
    }
    createTrackWithStartValue(id, startValue) {
        this.tracks[id] = new ValueTriggerTrack(startValue, this.level);
    }
    insertTrigger(id, trigger, time) {
        if (!this.tracks[id])
            this.tracks[id] = new ValueTriggerTrack(this.defaultStartValue, this.level);
        this.tracks[id].insertTrigger(trigger, time);
    }
    loadAllTriggers(idFunc) {
        for (let obj of this.level.getObjects()) {
            if (!(obj && obj instanceof value_trigger_1.ValueTrigger))
                continue;
            if (obj.spawnTriggered || obj.touchTriggered)
                continue;
            const id = idFunc(obj);
            if (id == null)
                continue;
            this.insertTrigger(id, obj, this.level.timeAt(obj.x));
        }
    }
    valueAt(id, time, layered = false) {
        const track = this.tracks[id];
        if (!track)
            return this.defaultStartValue;
        if (layered)
            return track.layeredValueAt(time);
        else
            return track.valueAt(time);
    }
    moveValueAt(id, time) {
        const track = this.tracks[id];
        if (!track)
            return new _1.Vec2(0, 0);
        return track.moveValueAt(time);
    }
}
exports.ValueTriggerTrackList = ValueTriggerTrackList;
