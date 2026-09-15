import { ValueTrigger } from "./value-trigger";
import { Util } from "../../util/util";
import { ObjectPropertyReader } from "../object";

export class AlphaTrigger extends ValueTrigger<number> {
    duration: number = 0;
    alpha: number = 1;
    targetGroupId: number = 0;

    applyProperties(rd: ObjectPropertyReader): void {
        super.applyProperties(rd);

        this.duration = rd.number(10, 0);
        this.alpha    = rd.number(35, 1);

        this.targetGroupId = rd.number(51, 0);
    }

    public override getTriggerTrackId(): number {
        return this.targetGroupId;
    }

    public override valueAfterDelta(startAlpha: number, deltaTime: number, _: number): number {
        if (deltaTime >= this.duration)
            return this.alpha;

        return Util.lerp(startAlpha, this.alpha, deltaTime / this.duration);
    }

    public override getDuration(): number {
        return this.duration;
    }

    static isOfType(id: number): boolean {
        return id == 1007;
    }
}