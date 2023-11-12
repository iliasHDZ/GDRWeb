import { GDObject } from "./object/object";
import { StopTrigger } from "./object/trigger/stop-trigger";
import { Trigger } from "./object/trigger/trigger";
declare class StopTriggerExecution {
    time: number;
    trigger: StopTrigger;
    constructor(trigger: StopTrigger, time: number);
}
interface GDLevel {
    getObjects(): GDObject[];
    timeAt(x: number): number;
    posAt(x: number): number;
}
export declare class StopTriggerTrack {
    executions: StopTriggerExecution[];
    level: GDLevel;
    constructor(level: GDLevel);
    insertTrigger(trigger: StopTrigger, time: number): void;
    nextExecutionAfter(time: number): StopTriggerExecution | null;
}
export declare class StopTriggerTrackList {
    tracks: {
        [id: number]: StopTriggerTrack;
    };
    level: GDLevel;
    constructor(level: GDLevel);
    insertTrigger(id: number, trigger: StopTrigger, time: number): void;
    loadAllTriggers(): void;
    nextExecutionAfter(id: number, time: number): StopTriggerExecution | null;
    triggerStoppedAt(trigger: Trigger, time: number): number;
}
export {};
