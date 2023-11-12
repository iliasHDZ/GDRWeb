"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StopTriggerTrackList = exports.StopTriggerTrack = void 0;
const stop_trigger_1 = require("./object/trigger/stop-trigger");
class StopTriggerExecution {
    constructor(trigger, time) {
        this.trigger = trigger;
        this.time = time;
    }
}
// DUPLICATE CODE WITH VALUETRIGGERTRACK, PLEASE FIX
class StopTriggerTrack {
    constructor(level) {
        this.executions = [];
        this.level = level;
    }
    insertTrigger(trigger, time) {
        const exec = new StopTriggerExecution(trigger, time);
        for (let i = 0; i < this.executions.length; i++) {
            if (this.executions[i].time > time) {
                this.executions.splice(i, 0, exec);
                return;
            }
        }
        this.executions.push(exec);
    }
    nextExecutionAfter(time) {
        for (let exec of this.executions) {
            if (exec.time > time)
                return exec;
        }
        return null;
    }
}
exports.StopTriggerTrack = StopTriggerTrack;
// DUPLICATE CODE WITH STOPTRIGGERTRACKLIST, PLEASE FIX
class StopTriggerTrackList {
    constructor(level) {
        this.tracks = {};
        this.level = level;
    }
    insertTrigger(id, trigger, time) {
        if (!this.tracks[id])
            this.tracks[id] = new StopTriggerTrack(this.level);
        this.tracks[id].insertTrigger(trigger, time);
    }
    loadAllTriggers() {
        for (let obj of this.level.getObjects()) {
            if (!(obj && obj instanceof stop_trigger_1.StopTrigger))
                continue;
            if (obj.spawnTriggered || obj.touchTriggered)
                continue;
            const id = obj.targetGroupId;
            this.insertTrigger(id, obj, this.level.timeAt(obj.x));
        }
    }
    nextExecutionAfter(id, time) {
        if (!this.tracks[id])
            return null;
        return this.tracks[id].nextExecutionAfter(time);
    }
    triggerStoppedAt(trigger, time) {
        let stoppedAt = null;
        for (let gid of trigger.groups) {
            const exec = this.nextExecutionAfter(gid, time);
            if (exec != null) {
                if (stoppedAt == null)
                    stoppedAt = exec.time;
                else
                    stoppedAt = Math.min(stoppedAt, exec.time);
            }
        }
        return stoppedAt;
    }
}
exports.StopTriggerTrackList = StopTriggerTrackList;
