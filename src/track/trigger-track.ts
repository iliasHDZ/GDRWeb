import { GDObject } from "../object/object";
import { Trigger } from "../object/trigger/trigger";

interface GDLevel {
    getObjects(): GDObject[];
    timeAt(x: number): number;
    posAt(x: number): number;
}

export class TriggerExecution {
    time: number;
    trigger: Trigger;

    constructor(trigger: Trigger, time: number) {
        this.trigger = trigger;
        this.time    = time;
    }
}

export abstract class TriggerTrack {
    protected level: GDLevel;

    constructor(level: GDLevel) {
        this.level = level;
    }

    protected abstract getExecutions(): TriggerExecution[];

    protected abstract createExecution(trigger: Trigger, time: number): TriggerExecution | null;

    public insertTrigger(trigger: Trigger, time: number) {
        const exec = this.createExecution(trigger, time);
        if (exec == null)
            return;

        const execs = this.getExecutions();

        for (let i = 0; i < execs.length; i++) {
            if (execs[i].time > time) {
                execs.splice(i, 0, exec);
                return;
            }
        }

        execs.push(exec);
    }
}

export abstract class TriggerTrackList {
    level: GDLevel;

    constructor(level: GDLevel) {
        this.level = level;
    }

    protected abstract getTracks(): { [id: number]: TriggerTrack };

    protected abstract createTrack(): TriggerTrack;

    public insertTrigger(id: number, trigger: Trigger, time: number) {
        const tracks = this.getTracks();

        if (!tracks[id])
            tracks[id] = this.createTrack();

        tracks[id].insertTrigger(trigger, time);
    }

    public loadAllNonSpawnTriggers(idFunc: (trigger: Trigger) => number | null) {
        for (let obj of this.level.getObjects()) {
            if (!(obj && obj instanceof Trigger))
                continue;

            if (obj.spawnTriggered || obj.touchTriggered)
                continue;

            const id = idFunc(obj);
            if (id == null)
                continue;

            this.insertTrigger(id, obj, this.level.timeAt(obj.x));
        }
    }
}