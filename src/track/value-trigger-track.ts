import { Trigger, TriggerAction } from "../object/trigger/trigger";
import { Util } from "../util/util";
import { TriggerTrack, TriggerTrackList } from "./trigger-track";
import { Level } from "../level";
import { ValueTrigger } from "../object/trigger/value-trigger";

export class ValueTriggerAction<Value> extends TriggerAction {
    track: ValueTriggerTrack<Value> | null = null;
    valueTrigger: ValueTrigger<Value>;
    cachedStartValue: Value | null = null;

    constructor(trigger: ValueTrigger<Value>, time: number) {
        super(trigger, time);

        this.valueTrigger = trigger;
    }

    clearCache() {
        this.cachedStartValue = null;
    }

    getStartValue(): Value {
        if (this.track == null)
            new Error("cannot get start value if action is not inserted into a track");

        if (!this.cachedStartValue)
            this.cachedStartValue = (this.track as ValueTriggerTrack<Value>).valueAt(this.time);

        return this.cachedStartValue;
    }

    valueAt(start: Value, time: number): Value {
        let maxExecutionTime = this.valueTrigger.getDuration();
        if (this.stopTime != null)
            maxExecutionTime = Math.min(maxExecutionTime, this.stopTime - this.time);

        const deltaTime = Util.clamp(time - this.time, 0, maxExecutionTime);
        
        return this.valueTrigger.valueAfterDelta(start, deltaTime, this.time);
    }

    getEndTime(): number {
        return this.time + this.valueTrigger.getDuration();
    }
}

export class ValueTriggerTrack<Value> extends TriggerTrack<ValueTriggerAction<Value>> {
    public startValue: Value;

    constructor(startValue: Value, level: Level, trackId?: number) {
        super(level, trackId);
        this.startValue = startValue;
    }

    protected clearCachedValuesAt(idx: number) {
        for (; idx < this.actions.length; idx++)
            this.actions[idx].clearCache();
    }

    public insertAction(action: ValueTriggerAction<Value>): number {
        action.track = this;
        const idx = super.insertAction(action);
        this.clearCachedValuesAt(idx);
        return idx;
    }

    public lastActionBefore(time: number): ValueTriggerAction<Value> | null {
        let lastAction: ValueTriggerAction<Value> | null = null;

        for (let action of this.actions) {
            if (action.time >= time) break;
            lastAction = action;
        }

        return lastAction;
    }

    public lastActionLeftOf(x: number): ValueTriggerAction<Value> | null {
        let lastAction: ValueTriggerAction<Value> | null = null;

        for (let action of this.actions) {
            if (action.trigger.spawnTriggered) continue;
            if (action.trigger.x >= x) break;
            lastAction = action;
        }

        return lastAction;
    }

    public valueAt(time: number): Value {
        const lastAction = this.lastActionBefore(time);
        if (!lastAction)
            return this.startValue;
        
        return lastAction.valueAt(lastAction.getStartValue(), time);
    }

    // Only used for pulse triggers
    public combinedValueAt(time: number): Value {
        let value = this.startValue;
        for (const action of this.actions) {
            if (action.time >= time) break;
            value = action.valueAt(value, time);
        }
        return value;
    }
}

export class ValueTriggerTrackList<Value> extends TriggerTrackList<ValueTriggerAction<Value>> {
    defaultStartValue: Value;

    constructor(level: Level, defaultStartValue: Value) {
        super(level);
        this.defaultStartValue = defaultStartValue;
    }

    protected override createTrack(id: number): TriggerTrack<ValueTriggerAction<Value>> {
        return new ValueTriggerTrack<Value>(this.defaultStartValue, this.level, id);
    }

    public get(id: number): ValueTriggerTrack<Value> | null {
        const track = this.tracks[id];
        if (!track) return null;

        return track as ValueTriggerTrack<Value>;
    }

    public getTracks(): ValueTriggerTrack<Value>[] {
        return this.tracks as ValueTriggerTrack<Value>[];
    }

    public createTrackWithStartValue(id: number, startValue: Value) {
        this.tracks[id] = new ValueTriggerTrack(startValue, this.level);
    }
}