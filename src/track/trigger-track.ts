import { Level } from "../level";
import { Trigger, TriggerAction } from "../object/trigger/trigger";

export class TriggerTrack<Action extends TriggerAction> {
    protected level: Level;
    protected trackId: number;
    protected actions: Action[] = [];

    constructor(level: Level, trackId: number = 0) {
        this.level = level;
        this.trackId = trackId;
    }

    public getActions(): Action[] {
        return this.actions;
    }

    public insertAction(action: Action): number {
        for (let i = 0; i < this.actions.length; i++) {
            if (this.actions[i].time > action.time) {
                this.actions.splice(i, 0, action);
                return i;
            }
        }

        this.actions.push(action);
        return this.actions.length - 1;
    }

    public nextActionAfter(time: number): Action | null {
        for (let action of this.actions) {
            if (action.time > time)
                return action;
        }

        return null;
    }
}

export interface ITriggerTrackList {
    insertActionById(id: number, action: TriggerAction): void;

    insertAction(action: TriggerAction): void;
};

export abstract class TriggerTrackList<Action extends TriggerAction> implements ITriggerTrackList {
    level: Level;
    tracks: { [id: number]: TriggerTrack<Action> } = {};

    constructor(level: Level) {
        this.level = level;
    }

    protected abstract createTrack(id: number): TriggerTrack<Action>;

    public insertActionById(id: number, action: TriggerAction) {
        if (id == 0)
            return;

        if (!this.tracks[id])
            this.tracks[id] = this.createTrack(id);

        this.tracks[id].insertAction(action as Action);
    }

    public insertAction(action: TriggerAction) {
        let id = action.trigger.getTriggerTrackId();
        if (id == null) {
            console.error("Trigger does not return track id");
            console.log(action.trigger);
            return;
        }

        if (action.trigger.isTrackIdGroupId())
            id = action.remapGroupId(id);

        this.insertActionById(id, action);
    }

    public nextActionAfter(id: number, time: number): Action | null {
        if (!this.tracks[id])
            return null;

        return this.tracks[id].nextActionAfter(time);
    }
}