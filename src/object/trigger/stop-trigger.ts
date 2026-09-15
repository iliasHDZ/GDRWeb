import { TriggerSimulator } from "../../trigger-simulator";
import { ObjectPropertyReader } from "../object";
import { Trigger, TriggerAction } from "./trigger";

export class StopTrigger extends Trigger {
    targetGroupId: number = 0;

    applyProperties(rd: ObjectPropertyReader): void {
        super.applyProperties(rd);

        this.targetGroupId = rd.number(51, 0);
    }

    getTriggerTrackId(): number {
        return this.targetGroupId;
    }

    static isOfType(id: number): boolean {
        return id == 1616;
    }

    public onFinishAction(simulator: TriggerSimulator, action: TriggerAction): void {
        const time = action.endTime;
        for (const action of simulator.currentActions.array) {
            // Might be slow
            if (action.trigger.groups.includes(this.targetGroupId))
                action.setStopTime(time);
        }
    }
}