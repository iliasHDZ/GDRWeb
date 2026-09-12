import { GroupTransform } from "../../transform/group-transform";
import { TransformInfo } from "../../transform/transform";
import { Util } from "../../util/util";
import { Vec2 } from "../../util/vec2";
import { ObjectPropertyReader } from "../object";
import { TransformTrigger } from "./transform-trigger";

export class ScaleTrigger extends TransformTrigger {
    targetScaleX: number = 0;
    targetScaleY: number = 0;

    divideX: boolean = false;
    divideY: boolean = false;

    onlyMove: boolean = false;

    centerGroupId: number = 0;

    applyProperties(rd: ObjectPropertyReader): void {
        super.applyProperties(rd);
        
        this.targetScaleX = rd.number(150, 1);
        this.targetScaleY = rd.number(151, 1);

        this.divideX = rd.bool(153, false);
        this.divideY = rd.bool(154, false);

        this.centerGroupId = rd.number(71, 0);

        this.onlyMove = rd.bool(133, false);
    }

    static isOfType(id: number): boolean {
        return id == 2067;
    }

    private getTargetScale(): Vec2 {
        let scaleX = this.targetScaleX;
        let scaleY = this.targetScaleY;

        if (this.divideX) scaleX = 1 / scaleX;
        if (this.divideY) scaleY = 1 / scaleY;

        return new Vec2(scaleX, scaleY);
    }
    
    public applyTransform(transform: GroupTransform, info: TransformInfo): void {
        let scale = this.getTargetScale();

        const movementEndRatio = info.movementStartRatio + info.movementAmount;

        scale = new Vec2(
            Util.lerp(1, scale.x, movementEndRatio) / Util.lerp(1, scale.x, info.movementStartRatio),
            Util.lerp(1, scale.y, movementEndRatio) / Util.lerp(1, scale.y, info.movementStartRatio),
        );

        const center = info.state.getCenterGroupPosition(this.centerGroupId);
        if (!center) {
            transform.scaleOnlyObject(scale);
            return;
        }

        transform.scale(scale, center, this.onlyMove);
    }

    public getSpecialCenterGroupId(): number | null {
        return this.centerGroupId;
    }

    public getDependentCenterGroupIds(): Set<number> {
        return new Set<number>([this.centerGroupId]);
    }
}