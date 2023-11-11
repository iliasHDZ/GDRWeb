import { Vec2 } from ".";
import { GDObject } from "./object/object";
import { MoveTriggerValue } from "./object/trigger/move-trigger";
import { TriggerValue, ValueTrigger } from "./object/trigger/value-trigger";
import { Util } from "./util/util";

class ValueTriggerExecution {
    time: number;
    trigger: ValueTrigger;
    track: ValueTriggerTrack;

    constructor(trigger: ValueTrigger, time: number, track: ValueTriggerTrack) {
        this.trigger = trigger;
        this.time    = time;
        this.track   = track;
    }

    valueAt(start: TriggerValue, time: number): TriggerValue {
        const deltaTime = Util.clamp(time - this.time, 0, this.trigger.getDuration());
        const deltaPos  = this.track.level.posAt(this.time + deltaTime) - this.trigger.x;

        if (this.trigger.shouldUseDeltaPos())
            return this.trigger.valueAfterDeltaPos(start, deltaPos);
        else
            return this.trigger.valueAfterDelta(start, deltaTime);
    }

    getEndTime(): number {
        return this.time + this.trigger.getDuration();
    }
}

interface GDLevel {
    getObjects(): GDObject[];
    timeAt(x: number): number;
    posAt(x: number): number;
}

export class ValueTriggerTrack {
    public executions: ValueTriggerExecution[];
    public startValue: TriggerValue;

    level: GDLevel;

    constructor(startValue: TriggerValue, level: GDLevel) {
        this.startValue = startValue;
        this.executions = [];
        this.level = level;
    }

    public setStartValue(value: TriggerValue) {
        this.startValue = value;
    }

    public insertTrigger(trigger: ValueTrigger, time: number) {
        const exec = new ValueTriggerExecution(trigger, time, this);

        for (let i = 0; i < this.executions.length; i++) {
            if (this.executions[i].time > time) {
                this.executions.splice(i, 0, exec);
                return;
            }
        }

        this.executions.push(exec);
    }

    public valueAt(time: number): TriggerValue {
        let value: TriggerValue = this.startValue;
        let lastExec: ValueTriggerExecution = null;

        for (let exec of this.executions) {
            if (exec.time >= time) break;

            if (lastExec) 
                value = lastExec.valueAt(value, exec.time);

            lastExec = exec;
        }

        if (lastExec)
            return lastExec.valueAt(value, time);
        
        return value;
    }

    public moveValueAt(time: number): Vec2 {
        let value: Vec2 = new Vec2(0, 0);

        for (let exec of this.executions) {
            if (exec.time >= time) break;

            value = value.add((exec.valueAt(new Vec2(0, 0), time) as MoveTriggerValue).offset);
        }
        
        return value;
    }

    public layeredValueAt(time: number): TriggerValue {
        let lastExec: ValueTriggerExecution = null;
        for (let exec of this.executions) {
            if (exec.time >= time) break;
            if (time < exec.getEndTime())
                lastExec = exec;
        }

        if (lastExec == null)
            return this.startValue;
        else
            return lastExec.valueAt(this.layeredValueAt(lastExec.time), time);
    }
}

export class ValueTriggerTrackList {
    public tracks: { [id: number]: ValueTriggerTrack } = {};
    
    defaultStartValue: TriggerValue;
    level: GDLevel;

    constructor(level: GDLevel, defaultStartValue: TriggerValue) {
        this.defaultStartValue = defaultStartValue;
        this.level = level;
    }

    public createTrackWithStartValue(id: number, startValue: TriggerValue) {
        this.tracks[id] = new ValueTriggerTrack(startValue, this.level);
    }

    public insertTrigger(id: number, trigger: ValueTrigger, time: number) {
        if (!this.tracks[id])
            this.tracks[id] = new ValueTriggerTrack(this.defaultStartValue, this.level);

        this.tracks[id].insertTrigger(trigger, time);
    }

    public loadAllTriggers(idFunc: (trigger: ValueTrigger) => number | null) {
        for (let obj of this.level.getObjects()) {
            if (!(obj && obj instanceof ValueTrigger))
                continue;

            if (obj.spawnTriggered || obj.touchTriggered)
                continue;

            const id = idFunc(obj);
            if (id == null)
                continue;

            this.insertTrigger(id, obj, this.level.timeAt(obj.x));
        }
    }

    public valueAt(id: number, time: number, layered: boolean = false): TriggerValue {
        const track = this.tracks[id];

        if (!track)
            return this.defaultStartValue;

        if (layered)
            return track.layeredValueAt(time);
        else
            return track.valueAt(time);
    }

    public moveValueAt(id: number, time: number): Vec2 {
        const track = this.tracks[id];
        if (!track)
            return new Vec2(0, 0);

        return track.moveValueAt(time);
    }
}