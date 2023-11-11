import { Trigger } from "./trigger";
export declare class TriggerValue {
}
export declare abstract class ValueTrigger extends Trigger {
    shouldUseDeltaPos(): boolean;
    valueAfterDeltaPos(startValue: TriggerValue, deltaPos: number): TriggerValue;
    abstract valueAfterDelta(startValue: TriggerValue, deltaTime: number): TriggerValue;
    abstract getDuration(): number;
}
