import { Level } from "./level";
import { GroupRemap } from "./object/trigger/spawn-trigger";
import { Trigger, TriggerAction } from "./object/trigger/trigger";
import { TransformAction } from "./transform/transform";
import { SortedList } from "./util/sortedlist";

export class TriggerSimulator {
    upcomingActions: SortedList<TriggerAction>;
    currentActions: SortedList<TriggerAction>;

    spawnableTriggersByGroupId: { [groupId: number]: Trigger[] } = {};
    multiSpawnableTriggersByGroupId: { [groupId: number]: Trigger[] } = {};

    level: Level;

    constructor(level: Level) {
        this.upcomingActions = new SortedList<TriggerAction>((a, b) => a.time - b.time);
        this.currentActions  = new SortedList<TriggerAction>((a, b) => a.endTime - b.endTime);

        this.level = level;
    }

    public init() {
        for (const object of this.level.getObjects()) {
            if (!(object instanceof Trigger))
                continue;

            if (object.spawnTriggered) {
                if (object.multiTriggered)
                    this.addToMultiSpawnableTriggersByGroupId(object);
                else
                    this.addToSpawnableTriggersByGroupId(object);
            } else if (!object.touchTriggered) {
                this.addTriggerAction(object, this.level.timeAt(object.x));
            }
        }
    }

    private addToSpawnableTriggersByGroupId(trigger: Trigger) {
        for (const groupId of trigger.groups) {
            if (!this.spawnableTriggersByGroupId[groupId])
                this.spawnableTriggersByGroupId[groupId] = [];
            this.spawnableTriggersByGroupId[groupId].push(trigger);
        }
    }

    private addToMultiSpawnableTriggersByGroupId(trigger: Trigger) {
        for (const groupId of trigger.groups) {
            if (!this.multiSpawnableTriggersByGroupId[groupId])
                this.multiSpawnableTriggersByGroupId[groupId] = [];
            this.multiSpawnableTriggersByGroupId[groupId].push(trigger);
        }
    }

    public addTriggerAction(trigger: Trigger, time: number, remap: GroupRemap = {}) {
        const action = trigger.createAction(time);
        action.groupRemap = remap;
        this.upcomingActions.push(action);
    }

    public spawnTrigger(trigger: Trigger, time: number, remap: GroupRemap = {}) {
        if (!trigger.multiTriggered) {
            for (const groupId of trigger.groups) {
                const array = this.multiSpawnableTriggersByGroupId[groupId];
                if (array) {
                    const index = array.indexOf(trigger);
                    if (index != -1)
                        array.splice(index, 1);
                }
            }
        }

        this.addTriggerAction(trigger, time, remap);
    }

    private addActionToTrack(action: TriggerAction) {
        if (action instanceof TransformAction) {
            this.level.transformManager.addAction(action);
            return;
        }

        const list = this.level.getTrackListForTrigger(action.trigger);
        if (list == null) return;

        list.insertAction(action);
    }

    private iterateSimulationUntil(timeLimit: number): boolean {
        let hasDoneSomething = false;

        let isActionStarting = false;
        let action: TriggerAction | null = null;

        if (this.upcomingActions.length > 0 && this.upcomingActions.at(0).time < timeLimit) {
            isActionStarting = true;
            action = this.upcomingActions.at(0);
        }

        if (this.currentActions.length > 0) {
            const limit = action ? action.time : timeLimit;
            if (this.currentActions.at(0).endTime < limit) {
                isActionStarting = false;
                action = this.currentActions.at(0);
            }
        }

        if (action) {
            if (isActionStarting) {
                this.upcomingActions.removeIndex(0);
                this.currentActions.push(action);
                action.trigger.onBeginAction(this, action);
                this.addActionToTrack(action);
                hasDoneSomething = true;
            } else {
                this.currentActions.removeIndex(0);
                if (action.stopTime == null)
                    action.trigger.onFinishAction(this, action);
                hasDoneSomething = true;
            }
        }

        return hasDoneSomething;
    }

    public simulateUntil(time: number) {
        // I hope this doesn't cause issues ...
        while (this.iterateSimulationUntil(time));
    }
   
    /*
    public simulate() {
        const timeLimit = this.level.timeAt(this.level.lastObjectXPosition) + 10;
        this.simulateUntil(timeLimit);

        const last
    }
    */
};