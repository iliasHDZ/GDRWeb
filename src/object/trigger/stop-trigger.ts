import { Level } from "../..";
import { GameObject } from "../object";
import { Trigger } from "./trigger";

export class StopTrigger extends Trigger {
    targetGroupId: number;

    applyData(data: {}): void {
        super.applyData(data);

        this.targetGroupId = GameObject.parse(data[51], 'number', 0);
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