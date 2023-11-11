"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupManager = exports.GroupState = void 0;
const _1 = require(".");
const alpha_trigger_1 = require("./object/trigger/alpha-trigger");
const move_trigger_1 = require("./object/trigger/move-trigger");
const toggle_trigger_1 = require("./object/trigger/toggle-trigger");
const value_trigger_track_1 = require("./value-trigger-track");
function isSameSet(set1, set2) {
    if (set1.length != set2.length)
        return false;
    for (let a of set1)
        if (!set2.includes(a))
            return false;
    return true;
}
class GroupState {
    constructor() {
        this.opacity = 1;
        this.offset = new _1.Vec2(0, 0);
        this.active = true;
    }
    /*lastPulseTime: number = 0;
    pulseBaseColor: Color = new Color(0, 0, 0, 0);
    pulseDetailColor: Color = new Color(0, 0, 0, 0);*/
    combineWith(state) {
        let res = new GroupState();
        res.opacity = this.opacity * state.opacity;
        res.offset = this.offset.add(state.offset);
        res.active = this.active || state.active;
        return res;
    }
}
exports.GroupState = GroupState;
function removeItem(array, value) {
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
class GroupManager {
    constructor(level) {
        // groupStates: { [id: number]: GroupState } = {};
        this.doubleGroups = {};
        this.lastDoubleGroupId = 0;
        this.startDoubleGroupIds = 0;
        this.groupCombs = {};
        this.lastGroupCombIdx = 0;
        this.largestGroupId = 0;
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
    getGroupCombinationIdx(groups) {
        for (let [k, v] of Object.entries(this.groupCombs))
            if (isSameSet(v, groups))
                return +k;
        return null;
    }
    getGroupCombination(idx) {
        if (idx == null)
            return [];
        return this.groupCombs[idx];
    }
    getTotalGroupCount() {
        return this.lastDoubleGroupId;
    }
    loadAlphaTracks() {
        this.alphaTrackList = new value_trigger_track_1.ValueTriggerTrackList(this.level, new alpha_trigger_1.AlphaTriggerValue(1));
        this.alphaTrackList.loadAllTriggers((trigger) => {
            if (!(trigger instanceof alpha_trigger_1.AlphaTrigger))
                return null;
            if (trigger.targetGroupId == 0)
                return null;
            return trigger.targetGroupId;
        });
    }
    loadMoveTracks() {
        this.moveTrackList = new value_trigger_track_1.ValueTriggerTrackList(this.level, new move_trigger_1.MoveTriggerValue(new _1.Vec2(0, 0)));
        this.moveTrackList.loadAllTriggers((trigger) => {
            if (!(trigger instanceof move_trigger_1.MoveTrigger))
                return null;
            if (trigger.targetGroupId == 0)
                return null;
            return trigger.targetGroupId;
        });
    }
    loadToggleTracks() {
        this.toggleTrackList = new value_trigger_track_1.ValueTriggerTrackList(this.level, new toggle_trigger_1.ToggleTriggerValue(true));
        this.toggleTrackList.loadAllTriggers((trigger) => {
            if (!(trigger instanceof toggle_trigger_1.ToggleTrigger))
                return null;
            if (trigger.targetGroupId == 0)
                return null;
            return trigger.targetGroupId;
        });
    }
    getAlphaValueAtTime(groupId, time) {
        this.level.profiler.start("Alpha Trigger Evaluation");
        const value = this.alphaTrackList.valueAt(groupId, time);
        let res = 1;
        if (value instanceof alpha_trigger_1.AlphaTriggerValue)
            res = value.alpha;
        this.level.profiler.end();
        return res;
    }
    getMoveOffsetAtTime(groupId, time) {
        this.level.profiler.start("Move Trigger Evaluation");
        const value = this.moveTrackList.moveValueAt(groupId, time);
        this.level.profiler.end();
        return value;
    }
    getActiveValueAtTime(groupId, time) {
        return this.toggleTrackList.valueAt(groupId, time).active;
    }
    getGroupStateAt(groupId, time) {
        if (groupId >= this.startDoubleGroupIds) {
            const [group1, group2] = this.doubleGroups[groupId];
            return this.getGroupStateAt(group1, time)
                .combineWith(this.getGroupStateAt(group2, time));
        }
        const state = new GroupState();
        state.opacity = this.getAlphaValueAtTime(groupId, time);
        state.offset = this.getMoveOffsetAtTime(groupId, time);
        state.active = this.getActiveValueAtTime(groupId, time);
        return state;
    }
    loadGroups() {
        for (let obj of this.level.getObjects()) {
            if (obj.groups.length == 0)
                continue;
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
    createDoubleGroup(group1, group2) {
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
    static mostCommonGroupId(groupCombs, withId = 0) {
        let groupIdFreqs = {};
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
                mostCommonId = +id;
                mostCommonIdFreq = freq;
            }
        }
        return mostCommonId;
    }
    compressLargeGroupCombinations(maxGroupsPerObject) {
        let largeGroupCombs = [];
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
exports.GroupManager = GroupManager;
