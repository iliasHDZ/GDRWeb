import { Level } from "../level";
import { GameObject } from "../object/object";
import { Trigger } from "../object/trigger/trigger";

export class TriggerAction {
    time: number;
    trigger: Trigger;

    constructor(trigger: Trigger, time: number) {
        this.trigger = trigger;
        this.time    = time;
    }
}

export abstract class TriggerTrack {
    protected level: Level;
    protected trackId: number;
    protected trackList?: TriggerTrackList;

    constructor(level: Level, trackId: number = 0, trackList?: TriggerTrackList) {
        this.level = level;
        this.trackId = trackId;
        this.trackList = trackList;
    }

    protected abstract getActions(): TriggerAction[];

    protected abstract createAction(trigger: Trigger, time: number): TriggerAction | null;

    public activateTriggerAt(trigger: Trigger, time: number): number {
        const exec = this.createAction(trigger, time);
        if (exec == null)
            return 0;

        const execs = this.getActions();

        for (let i = 0; i < execs.length; i++) {
            if (execs[i].time > time) {
                execs.splice(i, 0, exec);
                return i;
            }
        }

        trigger.addTrack(this);

        execs.push(exec);
        return execs.length - 1;
    }

    public removeTrigger(trigger: Trigger): number | null {
        const execs = this.getActions();

        let idx: number | null = null;
        for (let i = 0; i < execs.length; i++) {
            if (execs[i].trigger == trigger) {
                idx = i;
                break;
            }
        }

        trigger.removeTrack(this);

        if (idx == null)
            return null;

        execs.splice(idx, 1);
        return idx;
    }
}

export abstract class TriggerTrackList {
    level: Level;

    constructor(level: Level) {
        this.level = level;
    }

    protected abstract getTracks(): { [id: number]: TriggerTrack };

    protected abstract createTrack(id: number): TriggerTrack;

    public insertTriggerById(id: number, trigger: Trigger, time: number) {
        if (id == 0)
            return;

        const tracks = this.getTracks();

        if (!tracks[id])
            tracks[id] = this.createTrack(id);

        tracks[id].activateTriggerAt(trigger, time);
    }

    public insertTrigger(trigger: Trigger, time: number) {
        const id = trigger.getTriggerTrackId();
        if (id == null) {
            console.error("Trigger does not return track id");
            console.log(trigger);
            return;
        }

        this.insertTriggerById(id, trigger, time);
    }
}