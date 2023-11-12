import { GDObject } from "./object/object";
import { StopTrigger } from "./object/trigger/stop-trigger";
import { Trigger } from "./object/trigger/trigger";

class StopTriggerExecution {
    time: number;
    trigger: StopTrigger;

    constructor(trigger: StopTrigger, time: number) {
        this.trigger = trigger;
        this.time    = time;
    }
}

interface GDLevel {
    getObjects(): GDObject[];
    timeAt(x: number): number;
    posAt(x: number): number;
}

// DUPLICATE CODE WITH VALUETRIGGERTRACK, PLEASE FIX
export class StopTriggerTrack {
    public executions: StopTriggerExecution[];

    level: GDLevel;

    constructor(level: GDLevel) {
        this.executions = [];
        this.level = level;
    }

    public insertTrigger(trigger: StopTrigger, time: number) {
        const exec = new StopTriggerExecution(trigger, time);

        for (let i = 0; i < this.executions.length; i++) {
            if (this.executions[i].time > time) {
                this.executions.splice(i, 0, exec);
                return;
            }
        }

        this.executions.push(exec);
    }

    public nextExecutionAfter(time: number): StopTriggerExecution | null {
        for (let exec of this.executions) {
            if (exec.time > time)
                return exec;
        }

        return null;
    }
}

// DUPLICATE CODE WITH STOPTRIGGERTRACKLIST, PLEASE FIX
export class StopTriggerTrackList {
    public tracks: { [id: number]: StopTriggerTrack } = {};
    
    level: GDLevel;

    constructor(level: GDLevel) {
        this.level = level;
    }

    public insertTrigger(id: number, trigger: StopTrigger, time: number) {
        if (!this.tracks[id])
            this.tracks[id] = new StopTriggerTrack(this.level);

        this.tracks[id].insertTrigger(trigger, time);
    }

    public loadAllTriggers() {
        for (let obj of this.level.getObjects()) {
            if (!(obj && obj instanceof StopTrigger))
                continue;

            if (obj.spawnTriggered || obj.touchTriggered)
                continue;

            const id = obj.targetGroupId;

            this.insertTrigger(id, obj, this.level.timeAt(obj.x));
        }
    }

    public nextExecutionAfter(id: number, time: number): StopTriggerExecution | null {
        if (!this.tracks[id])
            return null;

        return this.tracks[id].nextExecutionAfter(time);
    }

    public triggerStoppedAt(trigger: Trigger, time: number): number {
        let stoppedAt: number | null = null;

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