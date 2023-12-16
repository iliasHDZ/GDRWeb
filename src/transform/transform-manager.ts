import { GameObject } from "../object/object";
import { StopTriggerTrackList } from "../track/stop-trigger-track";
import { GroupManager } from "../group-manager";
import { TransformTrigger } from "../object/trigger/transform-trigger";
import { TransformTrack } from "./transform-track";
import { GroupTransform } from "./group-transform";
import { Vec2 } from "../util/vec2";
import { Level } from "../level";

function isSameSet(set1: number[], set2: number[]): boolean {
    if (set1.length != set2.length)
        return false;

    for (let a of set1)
        if (!set2.includes(a))
            return false;

    return true;
}

export class TransformManager {
    level: Level;
    gmanager: GroupManager;

    transformingGroupIds: Set<number>;

    transformGroups: { [id: number]: number[] };
    lastTransformGroupIdx: number;

    centerGroupPositions: { [id: number]: Vec2 };
    
    groupCombIdxToTransformIdx: { [id: number]: number };

    tracks: { [id: number]: TransformTrack };

    constructor(level: Level, manager: GroupManager) {
        this.level = level;
        this.gmanager = manager;

        this.reset();
    }

    reset() {
        this.transformingGroupIds = new Set<number>();
        this.transformGroups = {};
        this.lastTransformGroupIdx = 1;
        this.groupCombIdxToTransformIdx = {};
        this.centerGroupPositions = {};
        this.tracks = {};
    }

    getTransformGroupIdx(groupIds: number[]): number | null {
        for (let [k, v] of Object.entries(this.transformGroups))
            if (isSameSet(v, groupIds))
                return +k;
        
        return null;
    }

    addTransformGroup(groupIds: number[]): number {
        const id = this.lastTransformGroupIdx++;
        this.transformGroups[id] = groupIds.slice();
        return id;
    }

    getTotalTransformCount(): number {
        return this.lastTransformGroupIdx;
    }

    public updateStopActions(id: number | null = null) {
        for (let tracks of Object.values(this.tracks))
            tracks.updateStopActions(id);
    }

    public valueAt(id: number, time: number): GroupTransform {
        let track = this.tracks[id];
        if (!track)
            return new GroupTransform();

        return track.valueAt(time);
    }

    public centerGroupPosAt(id: number, time: number): Vec2 | null {
        const pos = this.centerGroupPositions[id];
        if (!pos) return null;

        return this.valueAt(id, time).transformPoint(pos);
    }

    public doesTransformBetween(id: number, start: number, end: number): boolean {
        let track = this.tracks[id];
        if (!track)
            return false;

        return track.doesTransformBetween(start, end);
    }

    stripNonTransformingGroupIds(groupIds: number[]): number[] {
        const ret = groupIds.slice();
        for (let i = 0; i < ret.length;) {
            if (!this.transformingGroupIds.has(ret[i]))
                ret.splice(i, 1);
            else
                i++;
        }
        return ret;
    }

    loadAllTriggers() {
        this.tracks = {};

        for (let obj of this.level.getObjects()) {
            if (!(obj instanceof TransformTrigger))
                continue;

            if (obj.spawnTriggered || obj.touchTriggered)
                continue;

            for (let [k, v] of Object.entries(this.transformGroups)) {
                if (!v.includes(obj.targetGroupId)) continue;
                const transformId = +k;

                let track = this.tracks[transformId];
                if (track == null) {
                    track = new TransformTrack(this.level, this, transformId);
                    this.tracks[transformId] = track;
                }

                track.insertTrigger(obj, this.level.timeAt(obj.x));
            }
        }

        for (let v of Object.values(this.tracks))
            v.init();
    }

    public prepare() {
        this.reset();

        let groupObjectCount: { [id: number]: number } = {};

        for (let obj of this.level.getObjects()) {
            for (let gid of obj.groups) {
                if (!groupObjectCount[gid]) {
                    this.centerGroupPositions[gid] = new Vec2(obj.x, obj.y);
                    groupObjectCount[gid] = 0;
                }
                groupObjectCount[gid]++;
            }

            if (!(obj instanceof TransformTrigger))
                continue;

            this.transformingGroupIds.add(obj.targetGroupId);
        }

        for (let k of Object.keys(this.centerGroupPositions)) {
            if (groupObjectCount[+k] > 1)
                delete this.centerGroupPositions[+k];
        }

        const groupCombs = this.gmanager.rawGroupCombs;

        for (let [k, v] of Object.entries(groupCombs)) {
            const strippedComb = this.stripNonTransformingGroupIds(v);
            if (strippedComb.length == 0) continue;

            let idx = this.getTransformGroupIdx(strippedComb);
            if (idx == null) {
                idx = this.addTransformGroup(strippedComb);
            }

            this.groupCombIdxToTransformIdx[+k] = idx;
        }

        this.loadAllTriggers();
    }
}
