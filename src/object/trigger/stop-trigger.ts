import { GDObject } from "../object";
import { Trigger } from "./trigger";

export class StopTrigger extends Trigger {
    targetGroupId: number;

    applyData(data: {}): void {
        super.applyData(data);

        this.targetGroupId = GDObject.parse(data[51], 'number', 0);
    }

    static isOfType(id: number): boolean {
        return id == 1616;
    }
}