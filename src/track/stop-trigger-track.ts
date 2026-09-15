import { Level } from "../level";
import { Trigger, TriggerAction } from "../object/trigger/trigger";
import { TriggerTrack, TriggerTrackList } from "./trigger-track";

export class StopTriggerTrackList extends TriggerTrackList<TriggerAction> {
    constructor(level: Level) {
        super(level);
    }

    protected override createTrack(id: number): TriggerTrack<TriggerAction> {
        return new TriggerTrack<TriggerAction>(this.level, id);
    }

    public getTriggerStopTime(trigger: Trigger, time: number): number | null {
        let stoppedAt: number | null = null;

        for (let gid of trigger.groups) {
            const action = this.nextActionAfter(gid, time);
            if (action != null) {
                if (stoppedAt == null)
                    stoppedAt = action.time;
                else
                    stoppedAt = Math.min(stoppedAt, action.time);
            }
        }

        return stoppedAt;
    }
}