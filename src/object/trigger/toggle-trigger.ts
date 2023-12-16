import { GameObject } from "../object";
import { TriggerValue, ValueTrigger } from "./value-trigger";

export class ToggleTriggerValue extends TriggerValue {
    public active: boolean;

    constructor(active: boolean) {
        super();
        this.active = active;
    }

    static default(): ToggleTriggerValue {
        return new ToggleTriggerValue(true);
    }
}

export class ToggleTrigger extends ValueTrigger {
    activeGroup: boolean;
    targetGroupId: number;

    applyData(data: {}): void {
        super.applyData(data);

        this.activeGroup   = GameObject.parse(data[56], 'boolean', false);
        this.targetGroupId = GameObject.parse(data[51], 'number', 0);
    }

    getTriggerTrackId(): number {
        return this.targetGroupId;
    }

    public valueAfterDelta(_1: TriggerValue, _2: number, _3: number): TriggerValue {
        return new ToggleTriggerValue(this.activeGroup);
    }

    public getDuration(): number {
        return 0;
    }

    static isOfType(id: number): boolean {
        return id == 1049;
    }
}