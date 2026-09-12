import { Level } from "../../level";
import { Util } from "../../util/util";
import { GameObject, ObjectProperties, ObjectPropertyReader } from "../object";
import { TriggerValue, ValueTrigger } from "./value-trigger";

export class AlphaTriggerValue extends TriggerValue {
    public alpha: number;

    constructor(alpha: number) {
        super();
        this.alpha = alpha;
    }

    static default(): AlphaTriggerValue {
        return new AlphaTriggerValue(1);
    }
}

export class AlphaTrigger extends ValueTrigger {
    duration: number = 0;
    alpha: number = 1;
    targetGroupId: number = 0;

    applyProperties(rd: ObjectPropertyReader): void {
        super.applyProperties(rd);

        this.duration = rd.number(10, 0);
        this.alpha    = rd.number(35, 1);

        this.targetGroupId = rd.number(51, 0);
    }

    getTriggerTrackId(): number {
        return this.targetGroupId;
    }

    public valueAfterDelta(startValue: TriggerValue, deltaTime: number, _: number): TriggerValue {
        let startAlpha = 1;
        if (startValue instanceof AlphaTriggerValue)
            startAlpha = startValue.alpha;

        if (deltaTime >= this.duration)
            return new AlphaTriggerValue(this.alpha);

        return new AlphaTriggerValue(Util.lerp(startAlpha, this.alpha, deltaTime / this.duration));
    }

    public getDuration(): number {
        return this.duration;
    }

    static isOfType(id: number): boolean {
        return id == 1007;
    }
}