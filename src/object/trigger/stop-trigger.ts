import { Level } from "../..";
import { GameObject, ObjectPropertyReader } from "../object";
import { Trigger } from "./trigger";

export class StopTrigger extends Trigger {
    targetGroupId: number = 0;

    applyProperties(rd: ObjectPropertyReader): void {
        super.applyProperties(rd);

        this.targetGroupId = rd.number(51, 0);
    }

    onInsert(level: Level): void {
        super.onInsert(level);
        level.updateStopActions(this.targetGroupId);
    }

    onRemove(level: Level): void {
        super.onRemove(level);
        level.updateStopActions(this.targetGroupId);
    }

    getTriggerTrackId(): number {
        return this.targetGroupId;
    }

    static isOfType(id: number): boolean {
        return id == 1616;
    }
}