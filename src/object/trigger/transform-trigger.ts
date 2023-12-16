import { EasingStyle, easingFunction } from "../../util/easing";
import { GameObject } from "../object";
import { Trigger } from "./trigger";

export abstract class TransformTrigger extends Trigger {
    easing: EasingStyle;
    targetGroupId: number;
    duration: number;

    applyData(data: {}): void {
        super.applyData(data);

        this.easing = GameObject.parse(data[30], 'number', EasingStyle.NONE);
        this.targetGroupId = GameObject.parse(data[51], 'number', 0);
        this.duration = GameObject.parse(data[10], 'number', 0);
    }

    getTriggerTrackId(): number {
        return this.targetGroupId;
    }

    getChange(delta: number): number {
        const time = delta / this.duration;
        
        if (time >= 1 || isNaN(time))
            return 1;
        else {
            // TODO: Implement easing rate
            return easingFunction(time, this.easing);
        }
    }

    public getDuration(): number {
        return this.duration;
    }
}