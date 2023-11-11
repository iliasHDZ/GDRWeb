import { TriggerValue, ValueTrigger } from "./value-trigger";
export declare class AlphaTriggerValue extends TriggerValue {
    alpha: number;
    constructor(alpha: number);
}
export declare class AlphaTrigger extends ValueTrigger {
    duration: number;
    alpha: number;
    targetGroupId: number;
    applyData(data: {}): void;
    valueAfterDelta(startValue: TriggerValue, deltaTime: number): TriggerValue;
    getDuration(): number;
    static isOfType(id: number): boolean;
}
