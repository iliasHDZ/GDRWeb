import { Level } from "../..";
import { TriggerSimulator } from "../../trigger-simulator";
import { GameObject, ObjectPropertyReader } from "../object";
import { GroupRemap } from "./spawn-trigger";

export class TriggerAction {
    trigger: Trigger;
    time: number = 0;
    stopTime: number | null = null;
    groupRemap: GroupRemap = {};

    constructor(trigger: Trigger, time: number) {
        this.trigger = trigger;
        this.time    = time;
    }

    get duration(): number { return this.trigger.getDuration(); }
    get endTime(): number { return this.stopTime != null ? this.stopTime : (this.time + this.duration); }

    public setStopTime(time: number) {
        if (time >= this.endTime)
            return;
        this.stopTime = time;
    }

    public remapGroupId(groupId: number): number {
        if (typeof(this.groupRemap[groupId]) == 'number')
            return this.groupRemap[groupId];
        return groupId;
    }
}

export abstract class Trigger extends GameObject {
    spawnTriggered: boolean = false;
    touchTriggered: boolean = false;
    multiTriggered: boolean = false;

    applyProperties(rd: ObjectPropertyReader) {
        super.applyProperties(rd);

        this.spawnTriggered = rd.bool(62, false);
        this.touchTriggered = rd.bool(11, false);
        this.multiTriggered = rd.bool(87, false);
    }

/*
    onInsert(level: Level): void {
        if (this.spawnTriggered || this.touchTriggered)
            return;

        const list = level.getTrackListForTrigger(this);
        if (list == null) return;

        list.insertTrigger(this, level.timeAt(this.x));
    }
*/

    public getTriggerTrackId(): number {
        return (null as unknown) as number;
    }

    public isTrackIdGroupId(): boolean {
        return true;
    }

    public getDuration(): number {
        return 0;
    }

    public createAction(time: number): TriggerAction {
        return new TriggerAction(this, time);
    }

    public onBeginAction(_simulator: TriggerSimulator, _action: TriggerAction) {}

    public onFinishAction(_simulator: TriggerSimulator, _action: TriggerAction) {}
}
