import { Util } from "../../util/util";
import { GDObject } from "../object";
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

        this.duration = GDObject.parse(data[10], 'number', 0);
        this.alpha    = GDObject.parse(data[35], 'number', 1);

        this.targetGroupId = GDObject.parse(data[51], 'number', 0);
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