import { Level, Vec2 } from "..";
import { GameObject } from "../object/object";
import { MoveTrigger } from "../object/trigger/move-trigger";
import { RotateTrigger } from "../object/trigger/rotate-trigger";
import { TransformTrigger } from "../object/trigger/transform-trigger";
import { Trigger } from "../object/trigger/trigger";
import { StopTriggerTrackList } from "../track/stop-trigger-track";
import { TriggerExecution, TriggerTrack } from "../track/trigger-track";
import { SortedList } from "../util/sortedlist";
import { GroupTransform } from "./group-transform";
import { TransformManager } from "./transform-manager";

const TRANSFORM_ITERATION_LENGTH = 1 / 30;

let shouldPrint = false;

export class TransformTriggerExecution extends TriggerExecution {
    stoppedAt: number | null = null;

    track: TransformTrack;

    level: Level;

    constructor(trigger: TransformTrigger, level: Level, track: TransformTrack, time: number) {
        super(trigger, time);
        this.track = track;
        this.level = level;

        this.updateStopAction();
    }

    public updateStopAction(id: number | null = null) {
        if (id != null && !this.trigger.groups.includes(id))
            return;

        this.stoppedAt = this.level.stopTrackList.triggerStoppedAt(this.trigger, this.time);
    }

    getEndTime(): number {
        const endAfterDuration = this.time + (this.trigger as TransformTrigger).getDuration();
        return this.stoppedAt != null ? Math.min(this.stoppedAt, endAfterDuration) : endAfterDuration;
    }

    applyToTransform(transform: GroupTransform, start: number, end: number) {
        if (this.trigger instanceof MoveTrigger) {
            let startOffset = new Vec2(0, 0);
            if (start > this.time)
                startOffset = this.trigger.offsetAfterDelta(start - this.time, this.time, this.track.manager);

            const fullOffset = this.trigger.offsetAfterDelta(end - this.time, this.time, this.track.manager);
            const offset = fullOffset.sub(startOffset);

            if (shouldPrint)
                console.log("MOVE " + offset.x + ", " + offset.y, this.trigger);

            transform.translate(offset);
        } else if (this.trigger instanceof RotateTrigger) {
            let startAngle = 0;
            if (start > this.time)
                startAngle = this.trigger.rotationAfterDelta(start - this.time, this.time, this.track.manager);

            let fullAngle = this.trigger.rotationAfterDelta(end - this.time, this.time, this.track.manager);
            const center = this.track.manager.centerGroupPosAt(this.trigger.centerGroupId, start);
            if (center == null) return;

            const angle = -(fullAngle - startAngle);

            if (shouldPrint)
                console.log("ROTATE " + angle + "deg, " + center.x + ", " + center.y, this.trigger);

            transform.rotate(angle, center, this.trigger.lockObjectRot);
        }
    }
}

class TransformTrackNode {
    execs: TransformTriggerExecution[];
    track: TransformTrack;
    time: number;
    cachedValue: GroupTransform | null = null;

    constructor(execs: TransformTriggerExecution[], track: TransformTrack, time: number) {
        this.execs = execs;
        this.time  = time;
        this.track = track;
    }

    getStartValue(): GroupTransform {
        if (this.cachedValue != null)
            return this.cachedValue;

        this.cachedValue = this.track.valueAt(this.time);
        return this.cachedValue;
    }

    shouldIterate(endTime: number): boolean {
        let firstRotateTrigger: RotateTrigger | null = null;
        for (let exec of this.execs) {
            if (exec.trigger instanceof RotateTrigger) {
                firstRotateTrigger = exec.trigger;
                break;
            }
        }

        if (firstRotateTrigger == null)
            return false;

        if (this.execs.length > 1)
            return true;

        if (this.track.manager.doesTransformBetween(firstRotateTrigger.centerGroupId, this.time, endTime))
            return true;

        return false;
    }

    valueAt(startValue: GroupTransform, time: number): GroupTransform {
        let ret = startValue.copy();

        if (this.shouldIterate(time)) {
            for (let t = this.time; t < time; t += TRANSFORM_ITERATION_LENGTH) {
                const next = Math.min(t + TRANSFORM_ITERATION_LENGTH, time);
                
                for (let exec of this.execs)
                    exec.applyToTransform(ret, t, next);
            }
        } else {
            for (let exec of this.execs)
                exec.applyToTransform(ret, this.time, time);
        }


        return ret;
    }
};

interface ExecChange {
    exec: TransformTriggerExecution;
    start: boolean;
    instant: boolean;
    time: number;
}

export class TransformTrack extends TriggerTrack {
    executions: TransformTriggerExecution[];
    nodes: TransformTrackNode[];
    manager: TransformManager;

    transformId: number;

    constructor(level: Level, manager: TransformManager, transformId: number) {
        super(level);
        this.executions = [];
        this.manager = manager;
        this.transformId = transformId;
    }

    protected getExecutions(): TriggerExecution[] {
        return this.executions;
    }

    protected createExecution(trigger: Trigger, time: number): TriggerExecution | null {
        if (!(trigger instanceof TransformTrigger))
            return null;

        return new TransformTriggerExecution(trigger as TransformTrigger, this.level, this, time);
    }

    public updateStopActions(id: number | null = null) {
        for (let exec of this.executions)
            exec.updateStopAction(id);
    }

    public valueAt(time: number): GroupTransform {
        let lastNode: TransformTrackNode | null = null;
        /*if (this.transformId == 162) {
            console.log("--------");
            shouldPrint = true;
        }*/

        for (let node of this.nodes) {
            if (node.time >= time) break;
            lastNode = node;
        }

        if (lastNode == null)
            return new GroupTransform();

        const value = lastNode.valueAt(lastNode.getStartValue(), time);
        shouldPrint = false;
        return value;
    }

    public doesTransformBetween(start: number, end: number): boolean {
        for (let exec of this.executions) {
            const execStart = exec.time;
            const execEnd   = exec.getEndTime();
            if (execEnd > start || execStart < end)
                return true;
        }
        return false;
    }

    init() {
        this.nodes = [];
        let changesArray = new SortedList<ExecChange>((a, b) => a.time - b.time);

        for (let exec of this.executions) {
            const endTime = exec.getEndTime();
            if (exec.time == endTime) {
                changesArray.push({exec, start: true, instant: true, time: exec.time});
            } else {
                changesArray.push({exec, start: true, instant: false, time: exec.time});
                changesArray.push({exec, start: false, instant: false, time: endTime});
            }
        }

        let array = changesArray.array;

        let currentExecs: TransformTriggerExecution[] = [];
        let instantExecs: TransformTriggerExecution[] = [];

        for (let i = 0; i < array.length;) {
            const time = array[i].time;

            if (instantExecs.length != 0)
                instantExecs = [];

            // Maybe not use == for checking two floats
            while (i < array.length && array[i].time == time) {
                if (array[i].instant)
                    instantExecs.push(array[i].exec);
                else if (array[i].start)
                    currentExecs.push(array[i].exec);
                else {
                    const idx = currentExecs.indexOf(array[i].exec);
                    if (idx != -1)
                        currentExecs.splice(idx, 1);
                    else
                        console.warn("There may have been a problem lmao idk. Please contact developer.");
                }

                i++;
            }

            const execArray = currentExecs.slice();
            for (let e of instantExecs)
                execArray.push(e);

            this.nodes.push(new TransformTrackNode(execArray, this, time));
        }
    }
};