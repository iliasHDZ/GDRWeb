import { AlphaTrigger } from "./object/trigger/alpha-trigger";
import { ToggleTrigger } from "./object/trigger/toggle-trigger";
import { ValueTriggerTrackList } from "./track/value-trigger-track";
import { PulseTargetType, PulseTrigger } from "./object/trigger/pulse-trigger";
import { PulseList } from "./pulse/pulse-list";
import { ITriggerTrackList, TriggerTrackList } from "./track/trigger-track";
import { Trigger } from "./object/trigger/trigger";
import { Level } from "./level";

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
    active: boolean = true;
    pulseList: PulseList = new PulseList();
    /*lastPulseTime: number = 0;
    pulseBaseColor: Color = new Color(0, 0, 0, 0);
    pulseDetailColor: Color = new Color(0, 0, 0, 0);*/

    combineWith(state: GroupState): GroupState {
        let res = new GroupState();

        res.opacity = this.opacity * state.opacity;
        res.active  = this.active || state.active;

        res.pulseList = new PulseList();
        res.pulseList.addList(this.pulseList);
        res.pulseList.addList(state.pulseList);

        return res;
    }
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

    rawGroupCombs: { [comb: number]: number[] } = {};
    lastGroupCombIdx: number = 0;

    largestGroupId: number = 0;

    alphaTrackList: ValueTriggerTrackList<number>;
    toggleTrackList: ValueTriggerTrackList<boolean>;
    pulseTrackList: ValueTriggerTrackList<PulseList>;

    level: Level;

    constructor(level: Level) {
        this.level = level;
        this.alphaTrackList  = new ValueTriggerTrackList<number>(this.level, 1);
        this.toggleTrackList = new ValueTriggerTrackList<boolean>(this.level, true);
        this.pulseTrackList  = new ValueTriggerTrackList<PulseList>(this.level, new PulseList());

        this.reset();
    }

    reset() {
        // Yeah duplicate code I know, not sure what the best way is to fix this
        this.alphaTrackList  = new ValueTriggerTrackList<number>(this.level, 1);
        this.toggleTrackList = new ValueTriggerTrackList<boolean>(this.level, true);
        this.pulseTrackList  = new ValueTriggerTrackList<PulseList>(this.level, new PulseList());

        this.doubleGroups = {};
        this.lastDoubleGroupId = 0;
        this.startDoubleGroupIds = 0;
        this.rawGroupCombs = {};
        this.groupCombs = {};
        this.lastGroupCombIdx = 0;
        this.largestGroupId = 0;
    }

/*
    public updateStopActions(id: number | null = null) {
        this.alphaTrackList.updateStopActions(id);
        this.toggleTrackList.updateStopActions(id);
        this.pulseTrackList.updateStopActions(id);
    }
*/

    getGroupCombinationIdx(groups: number[]): number | null {
        for (let [k, v] of Object.entries(this.groupCombs))
            if (isSameSet(v, groups))
                return +k;
        
        return null;
    }

    getGroupCombination(idx: number | null): number[] {
        if (idx == null || !this.groupCombs[idx])
            return [];

        return this.groupCombs[idx];
    }

    getTotalGroupCount(): number {
        return this.lastDoubleGroupId;
    }

    getAlphaValueAtTime(groupId: number, time: number): number {
        return this.alphaTrackList.get(groupId)?.valueAt(time) ?? 1;
    }

    getActiveValueAtTime(groupId: number, time: number): boolean {
        return this.toggleTrackList.get(groupId)?.valueAt(time) ?? true;
    }

    getPulseListAtTime(groupId: number, time: number): PulseList {
        return this.pulseTrackList.get(groupId)?.combinedValueAt(time) ?? new PulseList();
    }

    getGroupStateAt(groupId: number, time: number): GroupState {
        if (groupId >= this.startDoubleGroupIds) {
            const [group1, group2] = this.doubleGroups[groupId];

            return this.getGroupStateAt(group1, time)
                .combineWith(this.getGroupStateAt(group2, time));
        }

        const state = new GroupState();
        state.opacity   = this.getAlphaValueAtTime(groupId, time);
        state.active    = this.getActiveValueAtTime(groupId, time);
        state.pulseList = this.getPulseListAtTime(groupId, time);

        return state;
    }

    loadGroups() {
        for (let obj of this.level.getObjects()) {
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
            this.rawGroupCombs[idx] = obj.groups.slice();
            this.groupCombs[idx] = obj.groups.slice();
            obj.groupComb = idx;
        }

        this.startDoubleGroupIds = this.largestGroupId + 1;
        this.lastDoubleGroupId = this.startDoubleGroupIds;
    }

    public getTrackListForTrigger(trigger: Trigger): ITriggerTrackList | null {
        if (trigger instanceof AlphaTrigger)
            return this.alphaTrackList;

        if (trigger instanceof ToggleTrigger)
            return this.toggleTrackList;

        if (trigger instanceof PulseTrigger && trigger.targetType == PulseTargetType.GROUP)
            return this.pulseTrackList;

        return null;
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