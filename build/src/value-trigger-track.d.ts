import { Vec2 } from ".";
import { GDObject } from "./object/object";
import { TriggerValue, ValueTrigger } from "./object/trigger/value-trigger";
declare class ValueTriggerExecution {
    time: number;
    trigger: ValueTrigger;
    track: ValueTriggerTrack;
    constructor(trigger: ValueTrigger, time: number, track: ValueTriggerTrack);
    valueAt(start: TriggerValue, time: number): TriggerValue;
    getEndTime(): number;
}
interface GDLevel {
    getObjects(): GDObject[];
    timeAt(x: number): number;
    posAt(x: number): number;
}
export declare class ValueTriggerTrack {
    executions: ValueTriggerExecution[];
    startValue: TriggerValue;
    level: GDLevel;
    constructor(startValue: TriggerValue, level: GDLevel);
    setStartValue(value: TriggerValue): void;
    insertTrigger(trigger: ValueTrigger, time: number): void;
    valueAt(time: number): TriggerValue;
    moveValueAt(time: number): Vec2;
    layeredValueAt(time: number): TriggerValue;
}
export declare class ValueTriggerTrackList {
    tracks: {
        [id: number]: ValueTriggerTrack;
    };
    defaultStartValue: TriggerValue;
    level: GDLevel;
    constructor(level: GDLevel, defaultStartValue: TriggerValue);
    createTrackWithStartValue(id: number, startValue: TriggerValue): void;
    insertTrigger(id: number, trigger: ValueTrigger, time: number): void;
    loadAllTriggers(idFunc: (trigger: ValueTrigger) => number | null): void;
    valueAt(id: number, time: number, layered?: boolean): TriggerValue;
    moveValueAt(id: number, time: number): Vec2;
}
export {};
