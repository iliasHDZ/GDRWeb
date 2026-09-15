import { GameObject } from "../object/object";
import { StopTriggerTrackList } from "../track/stop-trigger-track";
import { GroupManager } from "../group-manager";
import { TransformTrigger } from "../object/trigger/transform-trigger";
import { GroupTransform } from "./group-transform";
import { Vec2 } from "../util/vec2";
import { Level } from "../level";
import { TransformAction, TransformSimulator } from "./transform";

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

    transformingGroupIds: Set<number> = new Set<number>();

    transformGroups: { [id: number]: number[] } = {};
    lastTransformGroupIdx: number = 1;

    centerObjects: { [id: number]: GameObject } = {};
    
    groupCombIdxToTransformIdx: { [id: number]: number } = {};

    transformIdsPerGroupId: { [id: number]: number[] } = {};

    simulator: TransformSimulator = new TransformSimulator(this);

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
        this.centerObjects = {};
        this.transformIdsPerGroupId = {};
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
        for (const gid of groupIds) {
            if (!this.transformIdsPerGroupId[gid])
                this.transformIdsPerGroupId[gid] = [];
            this.transformIdsPerGroupId[gid].push(id);
        }
        return id;
    }

    getTotalTransformCount(): number {
        return this.lastTransformGroupIdx;
    }

    public valueAt(id: number, time: number): GroupTransform {
        return this.simulator.getGroupTransformAt(id, time);
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

    addAction(action: TransformAction) {
        this.simulator.addAction(action);
    }

    private fetchCenterGroupObjects() {
        let objectsPerGroupId: { [id: number]: GameObject[] } = {};
        let objectsPerParentGroupId: { [id: number]: GameObject[] } = {};

        for (let object of this.level.getObjects()) {
            for (let gid of object.groups) {
                if (!objectsPerGroupId[gid])
                    objectsPerGroupId[gid] = [];
                objectsPerGroupId[gid].push(object);
            }

            for (let gid of object.parentGroups) {
                if (!objectsPerParentGroupId[gid])
                    objectsPerParentGroupId[gid] = [];
                objectsPerParentGroupId[gid].push(object);
            }

            if (!(object instanceof TransformTrigger))
                continue;

            this.transformingGroupIds.add(object.targetGroupId);
        }

        for (const [gid, objects] of Object.entries(objectsPerGroupId)) {
            const pgObjects = objectsPerParentGroupId[+gid];
            if (pgObjects && pgObjects.length == 1) {
                this.centerObjects[+gid] = pgObjects[0];
                continue;
            }
            
            if (objects.length == 1)
                this.centerObjects[+gid] = objects[0];
        }
    }

    public prepare() {
        this.reset();

        this.fetchCenterGroupObjects();

        const groupCombs = this.gmanager.rawGroupCombs;

        this.addTransformGroup([]);

        for (let [groupCombId, groupIds] of Object.entries(groupCombs)) {
            const strippedComb = this.stripNonTransformingGroupIds(groupIds);

            let idx = this.getTransformGroupIdx(strippedComb);
            if (idx == null)
                idx = this.addTransformGroup(strippedComb);

            this.groupCombIdxToTransformIdx[+groupCombId] = idx;
        }

        this.simulator.init();

        this.simulator.prepareActions();
    }

    public simulateUntil(time: number) {
        this.simulator.simulateUntil(time);
    }
}
