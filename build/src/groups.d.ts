import { Vec2 } from ".";
import { GDObject } from "./object/object";
import { Profiler } from "./profiler";
import { StopTriggerTrackList } from "./stop-trigger-track";
import { ValueTriggerTrackList } from "./value-trigger-track";
export declare class GroupState {
    opacity: number;
    offset: Vec2;
    active: boolean;
    combineWith(state: GroupState): GroupState;
}
interface GDLevel {
    getObjects(): GDObject[];
    timeAt(x: number): number;
    posAt(x: number): number;
    stopTrackList: StopTriggerTrackList;
    profiler: Profiler;
}
export declare class GroupManager {
    doubleGroups: {
        [id: number]: [number, number];
    };
    lastDoubleGroupId: number;
    startDoubleGroupIds: number;
    groupCombs: {
        [comb: number]: number[];
    };
    lastGroupCombIdx: number;
    largestGroupId: number;
    alphaTrackList: ValueTriggerTrackList;
    moveTrackList: ValueTriggerTrackList;
    toggleTrackList: ValueTriggerTrackList;
    level: GDLevel;
    constructor(level: GDLevel);
    reset(): void;
    getGroupCombinationIdx(groups: number[]): number | null;
    getGroupCombination(idx: number | null): number[];
    getTotalGroupCount(): number;
    loadAlphaTracks(): void;
    loadMoveTracks(): void;
    loadToggleTracks(): void;
    getAlphaValueAtTime(groupId: number, time: number): number;
    getMoveOffsetAtTime(groupId: number, time: number): Vec2;
    getActiveValueAtTime(groupId: number, time: number): boolean;
    getGroupStateAt(groupId: number, time: number): GroupState;
    loadGroups(): void;
    createDoubleGroup(group1: number, group2: number): number;
    static mostCommonGroupId(groupCombs: number[][], withId?: number): number;
    compressLargeGroupCombinations(maxGroupsPerObject: number): void;
}
export {};
