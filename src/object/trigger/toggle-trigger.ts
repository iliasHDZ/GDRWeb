import { ValueTrigger } from "../..";
import { ObjectPropertyReader } from "../object";

export class ToggleTrigger extends ValueTrigger<boolean> {
    activeGroup: boolean = false;
    targetGroupId: number = 0;

    applyProperties(rd: ObjectPropertyReader): void {
        super.applyProperties(rd);

        this.activeGroup   = rd.bool(56, false);
        this.targetGroupId = rd.number(51, 0);
    }

    public override getTriggerTrackId(): number {
        return this.targetGroupId;
    }

    public override valueAfterDelta(_1: boolean, _2: number, _3: number): boolean {
        return this.activeGroup;
    }

    public doesValueAfterActionDependOnTheValueBeforeIt(): boolean {
        return false;
    }

    public override getDuration(): number {
        return 0;
    }

    static isOfType(id: number): boolean {
        return id == 1049;
    }
}