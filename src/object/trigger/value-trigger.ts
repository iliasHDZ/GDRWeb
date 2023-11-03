import { GDObject } from "../object";

/*
    The TriggerValue is the abstract object that represent the value that the ValueTrigger changes.
    Read ValueTrigger for more info.
*/
export class TriggerValue {}

/*
    A ValueTrigger is an abstract object that changes a specific value over a duration.
    Examples include: ColorTrigger, PulseTrigger, AlphaTrigger...
*/
export abstract class ValueTrigger extends GDObject {
    protected duration: number;

    public getDuration(): number {
        return this.duration;
    }

    public abstract valueAfterDelta(startValue: TriggerValue, deltaTime: number): TriggerValue;
}