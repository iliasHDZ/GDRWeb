import { Level } from "../..";
import { TriggerTrack } from "../../track/trigger-track";
import { GameObject, ObjectProperties, ObjectPropertyReader } from "../object";

export abstract class Trigger extends GameObject {
    spawnTriggered: boolean = false;
    touchTriggered: boolean = false;

    tracks: TriggerTrack[] = [];

    applyProperties(rd: ObjectPropertyReader) {
        super.applyProperties(rd);

        this.spawnTriggered = rd.bool(62, false);
        this.touchTriggered = rd.bool(11, false);
    }

    addTrack(track: TriggerTrack): void {
        this.tracks.push(track);
    }

    removeTrack(track: TriggerTrack): void {
        const idx = this.tracks.indexOf(track);
        if (idx != -1)
            this.tracks.splice(idx, 1);
    }

    onInsert(level: Level): void {
        if (this.spawnTriggered || this.touchTriggered)
            return;

        const list = level.getTrackListForTrigger(this);
        if (list == null) return;

        list.insertTrigger(this, level.timeAt(this.x));
    }
    
    onRemove(_: Level): void {
        for (let track of this.tracks) {
            track.removeTrigger(this);
        }
    }

    getTriggerTrackId(): number {
        return (null as unknown) as number;
    }
}
