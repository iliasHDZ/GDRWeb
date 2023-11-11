import { Trigger } from "./trigger";

/*
    The TriggerValue is the abstract object that represent the value that the ValueTrigger changes.
    Read ValueTrigger for more info.
*/
export class TriggerValue {}

/*
    A ValueTrigger is an abstract object that changes a specific value over a duration.
    Examples include: ColorTrigger, PulseTrigger, AlphaTrigger...
*/
export abstract class ValueTrigger extends Trigger {
    public shouldUseDeltaPos(): boolean {
        return false;
    }

    public valueAfterDeltaPos(startValue: TriggerValue, deltaPos: number): TriggerValue {
        return new TriggerValue();
    }

    public abstract valueAfterDelta(startValue: TriggerValue, deltaTime: number): TriggerValue;

    public abstract getDuration(): number;
}