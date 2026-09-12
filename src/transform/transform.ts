import { Level } from "../level";
import { TransformTrigger } from "../object/trigger/transform-trigger";
import { easingFunction, EasingStyle } from "../util/easing";
import { Vec2 } from "../util/vec2";
import { GroupTransform } from "./group-transform";
import { TransformManager } from "./transform-manager";

const TRANSFORM_ITERATION_LENGTH = 1 / 60;

export interface TransformInfo {
    action: TransformAction;
    state: TransformState;
    movementStartRatio: number;
    movementAmount: number;
    playerMovement: Vec2;
    cameraMovement: Vec2;
};

export class TransformAction {
    trigger: TransformTrigger;
    time: number = 0;
    stopTime: number | null = null;

    constructor(trigger: TransformTrigger, time: number) {
        this.trigger = trigger;
        this.time    = time;
    }

    get duration(): number { return this.trigger.duration; }
    get endTime(): number { return this.stopTime != null ? this.stopTime : (this.time + this.duration); }

    setStopTime(time: number) {
        if (time >= this.endTime)
            return;
        this.stopTime = time;
    }

    private applyEasing(value: number): number {
        return easingFunction(value, this.trigger.easing);
    }

    applyForTimeSegment(transform: GroupTransform, state: TransformState, segmentStart: number, segmentEnd: number) {
        segmentStart = Math.max(segmentStart, this.time);
        segmentEnd   = Math.min(segmentEnd,   this.endTime);

        const duration = this.duration;

        const startRatio = (duration != 0) ? ((segmentStart - this.time) / duration) : 0;
        const endRatio   = (duration != 0) ? ((segmentEnd   - this.time) / duration) : 1;

        const movementStartRatio = this.applyEasing(startRatio);
        const movementAmount = this.applyEasing(endRatio) - movementStartRatio;

        const info: TransformInfo = {
            action: this,
            state,
            movementStartRatio,
            movementAmount,
            playerMovement: state.level.getPlayerPositionAtTime(segmentEnd).sub(state.level.getPlayerPositionAtTime(segmentStart)),
            cameraMovement: new Vec2(0, 0)
        };

        this.trigger.applyTransform(transform, info);
    }
};

export class TransformState {
    time: number;
    transform: GroupTransform;
    actions: TransformAction[] = [];
    simulator: TransformSimulator;

    centerGroupIdPositions: { [id: number]: Vec2 } = {};

    constructor(
        time: number,
        simulator: TransformSimulator,
        transform: GroupTransform = new GroupTransform(),
        actions: TransformAction[] = []
    ) {
        this.time      = time;
        this.transform = transform;
        this.actions   = actions;
        this.simulator = simulator;

        this.reloadCenterGroupPositions();
    }

    public reloadCenterGroupPositions() {
        let usedCenterGroupIds = new Set<number>();
        for (const action of this.actions)
            usedCenterGroupIds = usedCenterGroupIds.union(action.trigger.getDependentCenterGroupIds());

        for (const groupId of usedCenterGroupIds) {
            if (this.centerGroupIdPositions[groupId])
                continue;
            const pos = this.simulator.getCenterGroupPosition(groupId, this.time);
            if (pos)
                this.centerGroupIdPositions[groupId] = pos;
        }
    }

    get level(): Level {
        return this.simulator.manager.level;
    }

    shouldIteratePerFrame(): boolean {
        if (this.actions.length > 1) {
            for (const action of this.actions) {
                const centerGroupId = action.trigger.getSpecialCenterGroupId();

                if (centerGroupId && this.getCenterGroupPosition(centerGroupId) != null)
                    return true;
            }
        }

        if (this.actions.length == 1) {
            const centerGroupId = this.actions[0].trigger.getSpecialCenterGroupId();
            return centerGroupId != null && this.simulator.isGroupTransforming(centerGroupId);
        }

        return false;
    }

    getCenterGroupPosition(centerGroupId: number): Vec2 | null {
        return this.centerGroupIdPositions[centerGroupId] ?? null;
    }

    getTransformAt(time: number): GroupTransform {
        if (this.time == time)
            return this.transform;

        const transform = this.transform.copy();
        for (const action of this.actions)
            action.applyForTimeSegment(transform, this, this.time, time);
        return transform;
    }

    getStateAt(time: number): TransformState {
        const transform = this.transform.copy();

        let newActions: TransformAction[] = [];
        for (const action of this.actions) {
            action.applyForTimeSegment(transform, this, this.time, time);
            if (time < action.endTime)
                newActions.push(action);
        }
        
        return new TransformState(time, this.simulator, transform, newActions);
    }
};

class TransformTrack {
    states: TransformState[] = [];
    simulator: TransformSimulator;
    id: number;
    currentTime: number = 0;

    constructor(simulator: TransformSimulator, id: number) {
        this.simulator = simulator;
        this.id = id;
    }

    private getLastState(): TransformState | null {
        if (this.states.length == 0) return null;
        return this.states[this.states.length - 1];
    }

    simulateUntil(time: number) {
        const lastState = this.getLastState();
        if (lastState && time <= this.currentTime)
            return;

        this.currentTime = time;

        let state: TransformState;
        if (!lastState)
            state = new TransformState(time, this.simulator, new GroupTransform());
        else
            state = lastState.getStateAt(time);
        this.states.push(state);
    }

    iterateUntil(time: number) {
        const lastState = this.getLastState();
        if (lastState && lastState.shouldIteratePerFrame())
            this.simulateUntil(time);
    }

    getCurrentTransform(): GroupTransform {
        const lastState = this.getLastState();
        if (!lastState) return new GroupTransform;
        return lastState.transform;
    }

    isTransforming(): boolean {
        const lastState = this.getLastState();
        return lastState != null && lastState.actions.length != 0;
    }

    addAction(action: TransformAction) {
        this.simulateUntil(action.time);
        const lastState = this.getLastState();
        if (lastState) {
            lastState.actions.push(action);
            lastState.reloadCenterGroupPositions();
        }
    }

    getTransformAt(time: number): GroupTransform {
        let lastState: TransformState | null = null;
        for (const state of this.states) {
            if (state.time <= time)
                lastState = state;
            else
                break;
        }

        if (!lastState)
            return new GroupTransform;

        return lastState.getTransformAt(time);
    }
};

export class TransformSimulator {
    actions: TransformAction[] = [];
    manager: TransformManager;

    tracks: TransformTrack[] = [];
    time: number = 0;
    currentActionIndex: number = 0;

    constructor(manager: TransformManager) {
        this.manager = manager;
    }

    addAction(action: TransformAction) {
        this.actions.push(action);

        if (action.trigger.targetGroupId == 130)
            console.log(action);

        if (action.time < this.time)
            this.time = action.time - 1;

        const transformIds = this.manager.transformIdsPerGroupId[action.trigger.targetGroupId];
        if (!transformIds)
            return;

        for (const transformId of transformIds) {
            if (action.time < this.tracks[transformId].currentTime)
                this.tracks[transformId].currentTime = action.time;
        }
    }

    getGroupTransformAt(transformId: number, time: number): GroupTransform {
        return this.tracks[transformId].getTransformAt(time);
    }

    getCenterGroupPosition(groupId: number, time: number): Vec2 | null {
        const object = this.manager.centerObjects[groupId];
        if (!object)
            return null;

        const track = this.tracks[this.manager.groupCombIdxToTransformIdx[object.groupComb]];
        track.iterateUntil(time);
        return track.getTransformAt(time).transformPoint(object.position);
    }

    isGroupTransforming(groupId: number): boolean {
        const transformIds = this.manager.transformIdsPerGroupId[groupId];

        if (!transformIds)
            return false;

        for (const transformId of transformIds) {
            if (this.tracks[transformId].isTransforming())
                return true;
        }
        return false;
    }

    init() {
        for (let i = 0; i < this.manager.getTotalTransformCount(); i++)
            this.tracks.push(new TransformTrack(this, i));

        this.time = 0;
        this.currentActionIndex = 0;
    }

    prepareActions() {
        this.actions.sort((a, b) => a.time - b.time);
    }

    private addActionToTracks(action: TransformAction) {
        const transformIds = this.manager.transformIdsPerGroupId[action.trigger.targetGroupId];
        if (!transformIds)
            return;

        for (const transformId of transformIds)
            this.tracks[transformId].addAction(action);
    }

    private iterateFrame(newTime: number) {
        if (newTime <= this.time)
            return;

        this.time = newTime;

        while (this.currentActionIndex < this.actions.length) {
            const action = this.actions[this.currentActionIndex];
            if (newTime > action.time) {
                this.addActionToTracks(action);
                this.currentActionIndex++;
            } else
                break;
        }

        for (const track of this.tracks)
            track.iterateUntil(newTime);
    }

    simulateUntil(endTime: number) {
        while (this.time < endTime)
            this.iterateFrame(this.time + TRANSFORM_ITERATION_LENGTH);
    }
};