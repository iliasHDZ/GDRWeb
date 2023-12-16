import { Level } from "../level";
import { StopTrigger } from "../object/trigger/stop-trigger";
import { Trigger } from "../object/trigger/trigger";
import { TriggerExecution, TriggerTrack, TriggerTrackList } from "./trigger-track";

class StopTriggerExecution extends TriggerExecution {
    constructor(trigger: StopTrigger, time: number) {
        super(trigger, time);
    }
}

export class StopTriggerTrack extends TriggerTrack {
    public executions: StopTriggerExecution[];

    constructor(level: Level) {
        super(level);
        this.executions = [];
    }

    protected getExecutions(): TriggerExecution[] {
        return this.executions;
    }

    protected createExecution(trigger: Trigger, time: number): TriggerExecution | null {
        if (!(trigger instanceof StopTrigger))
            return null;

        return new StopTriggerExecution(trigger, time);
    }

    public nextExecutionAfter(time: number): StopTriggerExecution | null {
        for (let exec of this.executions) {
            if (exec.time > time)
                return exec;
        }

        return null;
    }
}

export class StopTriggerTrackList extends TriggerTrackList {
    public tracks: { [id: number]: StopTriggerTrack } = {};

    constructor(level: Level) {
        super(level);
    }

    protected getTracks(): { [id: number]: TriggerTrack; } {
        return this.tracks;
    }

    protected createTrack(): TriggerTrack {
        return new StopTriggerTrack(this.level);
    }

    public nextExecutionAfter(id: number, time: number): StopTriggerExecution | null {
        if (!this.tracks[id])
            return null;

        return this.tracks[id].nextExecutionAfter(time);
    }

    public triggerStoppedAt(trigger: Trigger, time: number): number | null {
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