import { GroupTransform } from "../../transform/group-transform";
import { TransformInfo } from "../../transform/transform";
import { EasingStyle, easingFunction } from "../../util/easing";
import { GameObject, ObjectProperties, ObjectPropertyReader } from "../object";
import { Trigger } from "./trigger";

export abstract class TransformTrigger extends Trigger {
    easing: EasingStyle = EasingStyle.NONE;
    targetGroupId: number = 0;
    duration: number = 0;

    applyProperties(rd: ObjectPropertyReader): void {
        super.applyProperties(rd);

        this.easing        = rd.number(30, EasingStyle.NONE);
        this.targetGroupId = rd.number(51, 0);
        this.duration      = rd.number(10, 0);
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

    public abstract applyTransform(transform: GroupTransform, info: TransformInfo): void;

    public getSpecialCenterGroupId(): number | null {
        return null;
    }

    public getDependentCenterGroupIds(): Set<number> {
        return new Set<number>();
    }
}