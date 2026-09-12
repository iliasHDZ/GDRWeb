import { GameObject, ObjectProperties, ObjectPropertyReader } from "../object";
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
    activeGroup: boolean = false;
    targetGroupId: number = 0;

    applyProperties(rd: ObjectPropertyReader): void {
        super.applyProperties(rd);

        this.activeGroup   = rd.bool(56, false);
        this.targetGroupId = rd.number(51, 0);
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