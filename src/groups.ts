import { Vec2 } from ".";
import { GDObject } from "./object/object";
import { AlphaTrigger, AlphaTriggerValue } from "./object/trigger/alpha-trigger";
import { MoveTrigger, MoveTriggerValue } from "./object/trigger/move-trigger";
import { ToggleTrigger, ToggleTriggerValue } from "./object/trigger/toggle-trigger";
import { ValueTrigger } from "./object/trigger/value-trigger";
import { Profiler } from "./profiler";
import { Color } from "./util/color";
import { ValueTriggerTrack, ValueTriggerTrackList } from "./value-trigger-track";

function isSameSet(set1: number[], set2: number[]): boolean {
    if (set1.length != set2.length)
        return false;

    for (let a of set1)
        if (!set2.includes(a))
            return false;

    return true;
}

export class GroupState {
    opacity: number = 1;
    offset: Vec2 = new Vec2(0, 0);
    active: boolean = true;
    /*lastPulseTime: number = 0;
    pulseBaseColor: Color = new Color(0, 0, 0, 0);
    pulseDetailColor: Color = new Color(0, 0, 0, 0);*/

    combineWith(state: GroupState): GroupState {
        let res = new GroupState();

        res.opacity = this.opacity * state.opacity;
        res.offset  = this.offset.add(state.offset);
        res.active  = this.active || state.active;

        return res;
    }
}

interface GDLevel {
    getObjects(): GDObject[];
    timeAt(x: number): number;
    posAt(x: number): number;
    profiler: Profiler;
}

function removeItem<T>(array: T[], value: T) {
    var idx = array.indexOf(value);
    if (idx != -1)
        array.splice(idx, 1);
}

/*
    Objects can have many group ids per object which is unfavourable
    since we cannot have dynamic length array for every object and
    send it to render.

    Which is why the GroupManager creates double groups which are
    group ids the actually represent 2 different group ids. And so
    if there is a group id combination that is above the limit of
    group ids per object, 2 group ids are chosen to be combined into
    a double group and then are replaced with the double group's id.
    This will then reduce the amount of group ids in the combination
    by one.
*/

export class GroupManager {
    // groupStates: { [id: number]: GroupState } = {};

    doubleGroups: { [id: number]: [number, number] } = {};
    lastDoubleGroupId: number = 0;
    startDoubleGroupIds: number = 0;
    
    groupCombs: { [comb: number]: number[] } = {};
    lastGroupCombIdx: number = 0;

    largestGroupId: number = 0;

    alphaTrackList: ValueTriggerTrackList;
    moveTrackList: ValueTriggerTrackList;
    toggleTrackList: ValueTriggerTrackList;

    level: GDLevel;

    constructor(level: GDLevel) {
        this.level = level;
    }

    reset() {
        // this.groupStates = {};
        this.doubleGroups = {};
        this.lastDoubleGroupId = 0;
        this.startDoubleGroupIds = 0;
        this.groupCombs = {};
        this.lastGroupCombIdx = 0;
        this.largestGroupId = 0;
    }

    getGroupCombinationIdx(groups: number[]): number | null {
        for (let [k, v] of Object.entries(this.groupCombs))
            if (isSameSet(v, groups))
                return +k;
        
        return null;
    }

    getGroupCombination(idx: number | null): number[] {
        if (idx == null)
            return [];

        return this.groupCombs[idx];
    }

    getTotalGroupCount(): number {
        return this.lastDoubleGroupId;
    }

    loadAlphaTracks() {
        this.alphaTrackList = new ValueTriggerTrackList(this.level, new AlphaTriggerValue(1));

        this.alphaTrackList.loadAllTriggers((trigger: ValueTrigger) => {
            if (!(trigger instanceof AlphaTrigger))
                return null;

            if (trigger.targetGroupId == 0)
                return null;

            return trigger.targetGroupId;
        });
    }

    loadMoveTracks() {
        this.moveTrackList = new ValueTriggerTrackList(this.level, new MoveTriggerValue(new Vec2(0, 0)));

        this.moveTrackList.loadAllTriggers((trigger: ValueTrigger) => {
            if (!(trigger instanceof MoveTrigger))
                return null;

            if (trigger.targetGroupId == 0)
                return null;

            return trigger.targetGroupId;
        });
    }

    loadToggleTracks() {
        this.toggleTrackList = new ValueTriggerTrackList(this.level, new ToggleTriggerValue(true));

        this.toggleTrackList.loadAllTriggers((trigger: ValueTrigger) => {
            if (!(trigger instanceof ToggleTrigger))
                return null;

            if (trigger.targetGroupId == 0)
                return null;

            return trigger.targetGroupId;
        });
    }

    getAlphaValueAtTime(groupId: number, time: number): number {
        this.level.profiler.start("Alpha Trigger Evaluation");
        const value = this.alphaTrackList.valueAt(groupId, time);
        let res = 1;
        if (value instanceof AlphaTriggerValue)
            res = value.alpha;
        this.level.profiler.end();

        return res;
    }

    getMoveOffsetAtTime(groupId: number, time: number): Vec2 {
        this.level.profiler.start("Move Trigger Evaluation");
        const value = this.moveTrackList.moveValueAt(groupId, time);
        this.level.profiler.end();
        return value;
    }

    getActiveValueAtTime(groupId: number, time: number): boolean {
        return (this.toggleTrackList.valueAt(groupId, time) as ToggleTriggerValue).active;
    }

    getGroupStateAt(groupId: number, time: number): GroupState {
        if (groupId >= this.startDoubleGroupIds) {
            const [group1, group2] = this.doubleGroups[groupId];

            return this.getGroupStateAt(group1, time)
                .combineWith(this.getGroupStateAt(group2, time));
        }

        const state = new GroupState();
        state.opacity = this.getAlphaValueAtTime(groupId, time);
        state.offset  = this.getMoveOffsetAtTime(groupId, time);
        state.active  = this.getActiveValueAtTime(groupId, time);

        return state;
    }

    loadGroups() {
        for (let obj of this.level.getObjects()) {
            if (obj.groups.length == 0) continue;

            for (let gid of obj.groups) {
                if (gid > this.largestGroupId)
                    this.largestGroupId = gid;
            }

            let idx = this.getGroupCombinationIdx(obj.groups);
            if (idx != null) {
                obj.groupComb = idx;
                continue;
            }

            idx = this.lastGroupCombIdx++;
            this.groupCombs[idx] = obj.groups.slice();
            obj.groupComb = idx;
        }

        this.startDoubleGroupIds = this.largestGroupId + 1;
        this.lastDoubleGroupId = this.startDoubleGroupIds;
    }

    createDoubleGroup(group1: number, group2: number): number {
        let id = this.lastDoubleGroupId++;
        this.doubleGroups[id] = [group1, group2];

        for (let comb of Object.values(this.groupCombs)) {
            if (!comb.includes(group1) || !comb.includes(group2))
                continue;

            removeItem(comb, group1);
            removeItem(comb, group2);

            comb.push(id);
        }

        return id;
    }

    static mostCommonGroupId(groupCombs: number[][], withId: number = 0): number {
        let groupIdFreqs: { [id: number]: number } = {};

        for (let comb of groupCombs) {
            if (withId != 0 && !comb.includes(withId))
                continue;

            for (let id of comb) {
                if (withId != 0 && withId == id)
                    continue;

                if (groupIdFreqs[id] != null)
                    groupIdFreqs[id]++;
                else
                    groupIdFreqs[id] = 1;
            }
        }
        
        let mostCommonId = 0;
        let mostCommonIdFreq = 0;

        for (let [id, freq] of Object.entries(groupIdFreqs)) {
            if (freq > mostCommonIdFreq) {
                mostCommonId     = +id;
                mostCommonIdFreq = freq;
            }
        }

        return mostCommonId;
    }

    compressLargeGroupCombinations(maxGroupsPerObject: number) {
        let largeGroupCombs: number[][] = [];

        for (let comb of Object.values(this.groupCombs)) {
            if (comb.length > maxGroupsPerObject)
                largeGroupCombs.push(comb);
        }

        while (largeGroupCombs.length > 0) {
            const mostCommonId = GroupManager.mostCommonGroupId(largeGroupCombs);
            const mostCommonOtherId = GroupManager.mostCommonGroupId(largeGroupCombs, mostCommonId);

            if (mostCommonOtherId == 0)
                break;

            this.createDoubleGroup(mostCommonId, mostCommonOtherId);

            largeGroupCombs = largeGroupCombs.filter(comb => comb.length > maxGroupsPerObject);
        }

        if (largeGroupCombs.length == 0)
            return;

        while (largeGroupCombs.length > 0) {
            const group1 = largeGroupCombs[0][0];
            const group2 = largeGroupCombs[0][1];

            this.createDoubleGroup(group1, group2);

            largeGroupCombs = largeGroupCombs.filter(comb => comb.length > maxGroupsPerObject);
        }
    }
}