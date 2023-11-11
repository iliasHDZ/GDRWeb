import { TriggerValue, ValueTrigger } from "./value-trigger";
export declare class ToggleTriggerValue extends TriggerValue {
    active: boolean;
    constructor(active: boolean);
}
export declare class ToggleTrigger extends ValueTrigger {
    activeGroup: boolean;
    targetGroupId: number;
    applyData(data: {}): void;
    valueAfterDelta(_1: TriggerValue, _2: number): TriggerValue;
    getDuration(): number;
    static isOfType(id: number): boolean;
}
