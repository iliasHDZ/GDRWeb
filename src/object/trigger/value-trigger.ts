import { ValueTriggerAction } from "../../track/value-trigger-track";
import { Trigger, TriggerAction } from "./trigger";

/*
    A ValueTrigger is an abstract Trigger that changes a specific value over a duration.
    Examples include: ColorTrigger, PulseTrigger, AlphaTrigger...
*/
export abstract class ValueTrigger<T> extends Trigger {
    public abstract valueAfterDelta(startValue: T, deltaTime: number, startTime: number): T;

    public abstract getDuration(): number;

    public doesValueAfterActionDependOnTheValueBeforeIt(): boolean {
        return true;
    }

    public shouldCombineValues(): boolean {
        return false;
    }

    public override createAction(time: number): TriggerAction {
        return new ValueTriggerAction<T>(this, time);
    }
}