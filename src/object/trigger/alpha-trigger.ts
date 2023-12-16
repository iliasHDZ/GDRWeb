import { Level } from "../../level";
import { Util } from "../../util/util";
import { GameObject } from "../object";
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
    duration: number;
    alpha: number;
    targetGroupId: number;

    applyData(data: {}): void {
        super.applyData(data);

        this.duration = GameObject.parse(data[10], 'number', 0);
        this.alpha    = GameObject.parse(data[35], 'number', 1);

        this.targetGroupId = GameObject.parse(data[51], 'number', 0);
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