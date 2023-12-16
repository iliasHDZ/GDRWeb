import { GameObject } from "../object/object";
import { MoveTrigger } from "../object/trigger/move-trigger";
import { Trigger } from "../object/trigger/trigger";
import { TriggerValue, ValueTrigger } from "../object/trigger/value-trigger";
import { StopTriggerTrackList } from "./stop-trigger-track";
import { Util } from "../util/util";
import { TriggerExecution, TriggerTrack, TriggerTrackList } from "./trigger-track";
import { ColorTrigger } from "../object/trigger/color-trigger";
import { AlphaTrigger } from "../object/trigger/alpha-trigger";
import { ToggleTrigger } from "../object/trigger/toggle-trigger";
import { Level } from "../level";

class ValueTriggerExecution extends TriggerExecution {
    track: ValueTriggerTrack;
    stoppedAt: number | null = null;
    valueTrigger: ValueTrigger;
    cachedStartValue: TriggerValue | null = null;

    level: Level;

    constructor(trigger: ValueTrigger, time: number, level: Level, track: ValueTriggerTrack) {
        super(trigger, time);

        this.valueTrigger = trigger;
        this.track = track;

        this.level = level;

        this.updateStopAction();
    }

    public updateStopAction(id: number | null = null) {
        if (id != null && !this.trigger.groups.includes(id))
            return;

        this.stoppedAt = this.level.stopTrackList.triggerStoppedAt(this.trigger, this.time);
    }

    clearCache() {
        this.cachedStartValue = null;
    }

    getStartValue(): TriggerValue {
        if (!this.cachedStartValue)
            this.cachedStartValue = this.track.valueAt(this.time);

        return this.cachedStartValue;
    }

    valueAt(start: TriggerValue, time: number): TriggerValue {
        let maxExecutionTime = this.valueTrigger.getDuration();
        if (this.stoppedAt != null)
            maxExecutionTime = Math.min(maxExecutionTime, this.stoppedAt - this.time);

        const deltaTime = Util.clamp(time - this.time, 0, maxExecutionTime);
        
        return this.valueTrigger.valueAfterDelta(start, deltaTime, this.time);
    }

    getEndTime(): number {
        return this.time + this.valueTrigger.getDuration();
    }
}

export class ValueTriggerTrack extends TriggerTrack {
    public executions: ValueTriggerExecution[];
    public startValue: TriggerValue;

    constructor(startValue: TriggerValue, level: Level, trackId?: number, trackList?: ValueTriggerTrackList) {
        super(level, trackId, trackList);
        this.startValue = startValue;
        this.executions = [];
    }

    public updateStopActions(id: number | null = null) {
        for (let exec of this.executions)
            exec.updateStopAction(id);
    }

    public setStartValue(value: TriggerValue) {
        this.startValue = value;
    }

    protected getExecutions(): TriggerExecution[] {
        return this.executions;
    }

    protected createExecution(trigger: Trigger, time: number): TriggerExecution | null {
        if (!(trigger instanceof ValueTrigger))
            return null;

        return new ValueTriggerExecution(trigger, time, this.level, this);
    }

    protected clearCachedValuesAt(idx: number) {
        for (; idx < this.executions.length; idx++)
            this.executions[idx].clearCache();
    }

    public insertTrigger(trigger: Trigger, time: number): number {
        const idx = super.insertTrigger(trigger, time);
        this.clearCachedValuesAt(idx);

        return idx;
    }

    public removeTrigger(trigger: Trigger): number | null {
        const idx = super.removeTrigger(trigger);
        if (idx != null)
            this.clearCachedValuesAt(idx);

        return idx;
    }

    public lastExecutionBefore(time: number): ValueTriggerExecution | null {
        let lastExec: ValueTriggerExecution | null = null;

        for (let exec of this.executions) {
            if (exec.time >= time) break;
            lastExec = exec;
        }

        return lastExec;
    }

    public lastExecutionLeftOf(x: number): ValueTriggerExecution | null {
        let lastExec: ValueTriggerExecution | null = null;

        for (let exec of this.executions) {
            if (exec.trigger.spawnTriggered) continue;
            if (exec.trigger.x >= x) break;
            lastExec = exec;
        }

        return lastExec;
    }

    public valueAt(time: number): TriggerValue {
        const lastExec = this.lastExecutionBefore(time);
        if (!lastExec)
            return this.startValue;
        
        return lastExec.valueAt(lastExec.getStartValue(), time);
    }

    public lastValueAt(time: number): TriggerValue {
        const lastExec = this.lastExecutionBefore(time);
        if (!lastExec)
            return this.startValue;
        
        return lastExec.valueAt(this.startValue, time);
    }

    public combinedValueAt(startValue: TriggerValue, time: number): TriggerValue {
        let value = startValue;

        for (let exec of this.executions) {
            if (exec.time >= time) break;

            value = value.combineWith(exec.valueAt(startValue, time));
            if (value == null)
                return startValue;
        }
        
        return value;
    }
}

export class ValueTriggerTrackList extends TriggerTrackList {
    public tracks: { [id: number]: ValueTriggerTrack } = {};
    
    defaultStartValue: TriggerValue;

    constructor(level: Level, defaultStartValue: TriggerValue) {
        super(level);
        this.defaultStartValue = defaultStartValue;
    }

    protected getTracks(): { [id: number]: TriggerTrack } {
        return this.tracks;
    }

    protected createTrack(id: number): TriggerTrack {
        return new ValueTriggerTrack(this.defaultStartValue, this.level, id, this);
    }

    public updateStopActions(id: number | null = null) {
        for (let track of Object.values(this.tracks))
            track.updateStopActions(id);
    }

    public get(id: number): ValueTriggerTrack | null {
        const track = this.tracks[id];
        if (!track) return null;

        return track;
    }

    public createTrackWithStartValue(id: number, startValue: TriggerValue) {
        this.tracks[id] = new ValueTriggerTrack(startValue, this.level);
    }

    public loadAllColorTriggers(progFunc: (perc: number) => void | null = null) {
        this.loadAllNonSpawnTriggers((trigger: ValueTrigger) => {
            if (!(trigger instanceof ColorTrigger))
                return null;

            return trigger.color;
        }, progFunc);
    }
    
    // FIXME: Duplicate code with move triggers and toggle triggers
    public loadAllAlphaTriggers(progFunc: (perc: number) => void | null = null) {
        this.loadAllNonSpawnTriggers((trigger: ValueTrigger) => {
            if (!(trigger instanceof AlphaTrigger))
                return null;

            if (trigger.targetGroupId == 0)
                return null;

            return trigger.targetGroupId;
        }, progFunc);
    }

    public loadAllToggleTriggers(progFunc: (perc: number) => void | null = null) {
        this.loadAllNonSpawnTriggers((trigger: ValueTrigger) => {
            if (!(trigger instanceof ToggleTrigger))
                return null;

            if (trigger.targetGroupId == 0)
                return null;

            return trigger.targetGroupId;
        }, progFunc);
    }

    public valueAt(id: number, time: number): TriggerValue {
        const track = this.tracks[id];
        if (!track)
            return this.defaultStartValue;

        return track.valueAt(time);
    }

    public lastValueAt(id: number, time: number): TriggerValue {
        const track = this.tracks[id];
        if (!track)
            return this.defaultStartValue;

        return track.lastValueAt(time);
    }

    public combinedValueAt(id: number, time: number): TriggerValue {
        const track = this.tracks[id];
        if (!track)
            return this.defaultStartValue;

        return track.combinedValueAt(this.defaultStartValue, time);
    }
}