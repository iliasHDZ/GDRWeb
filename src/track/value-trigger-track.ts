import { GDObject } from "../object/object";
import { MoveTrigger } from "../object/trigger/move-trigger";
import { Trigger } from "../object/trigger/trigger";
import { TriggerValue, ValueTrigger } from "../object/trigger/value-trigger";
import { StopTriggerTrackList } from "./stop-trigger-track";
import { Util } from "../util/util";
import { TriggerExecution, TriggerTrack, TriggerTrackList } from "./trigger-track";
import { ColorTrigger } from "../object/trigger/color-trigger";
import { AlphaTrigger } from "../object/trigger/alpha-trigger";
import { ToggleTrigger } from "../object/trigger/toggle-trigger";

class ValueTriggerExecution extends TriggerExecution {
    track: ValueTriggerTrack;
    stoppedAt: number | null;
    valueTrigger: ValueTrigger;
    cachedStartValue: TriggerValue | null = null;

    constructor(trigger: ValueTrigger, time: number, track: ValueTriggerTrack, stoppedAt: number | null = null) {
        super(trigger, time);

        this.valueTrigger = trigger;

        this.track     = track;
        this.stoppedAt = stoppedAt;
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

// circular dependencies 😠😠😠
interface GDLevel {
    getObjects(): GDObject[];
    timeAt(x: number): number;
    posAt(x: number): number;
    stopTrackList: StopTriggerTrackList;
}

export class ValueTriggerTrack extends TriggerTrack {
    public executions: ValueTriggerExecution[];
    public startValue: TriggerValue;

    public sLevel: GDLevel;

    constructor(startValue: TriggerValue, level: GDLevel) {
        super(level);
        this.startValue = startValue;
        this.executions = [];
        this.sLevel = level;
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

        const stoppedAt = this.sLevel.stopTrackList.triggerStoppedAt(trigger, time);

        return new ValueTriggerExecution(trigger, time, this, stoppedAt);
    }

    public insertTrigger(trigger: Trigger, time: number): number {
        const idx = super.insertTrigger(trigger, time);
        for (let i = idx; i < this.executions.length; i++)
            this.executions[i].cachedStartValue = null;

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
    eLevel: GDLevel;

    constructor(level: GDLevel, defaultStartValue: TriggerValue) {
        super(level);
        this.defaultStartValue = defaultStartValue;
        this.eLevel = level;
    }

    protected getTracks(): { [id: number]: TriggerTrack } {
        return this.tracks;
    }

    protected createTrack(): TriggerTrack {
        return new ValueTriggerTrack(this.defaultStartValue, this.eLevel);
    }

    public get(id: number): TriggerTrack | null {
        const track = this.tracks[id];
        if (!track) return null;

        return track;
    }

    public createTrackWithStartValue(id: number, startValue: TriggerValue) {
        this.tracks[id] = new ValueTriggerTrack(startValue, this.eLevel);
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

    public loadAllMoveTriggers(progFunc: (perc: number) => void | null = null) {
        this.loadAllNonSpawnTriggers((trigger: ValueTrigger) => {
            if (!(trigger instanceof MoveTrigger))
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