import { GroupTransform } from "../../transform/group-transform";
import { TransformInfo } from "../../transform/transform";
import { TransformManager } from "../../transform/transform-manager";
import { ObjectPropertyReader } from "../object";
import { TransformTrigger } from "./transform-trigger";

export class RotateTrigger extends TransformTrigger {
    degrees: number = 0;
    times360: number = 0;

    lockObjectRot: boolean = false;

    centerGroupId: number = 0;

    applyProperties(rd: ObjectPropertyReader): void {
        super.applyProperties(rd);
        
        this.degrees = rd.number(68, 0);
        this.times360 = rd.number(69, 0);

        this.lockObjectRot = rd.bool(70, false);

        this.centerGroupId = rd.number(71, 0);
    }

    static isOfType(id: number): boolean {
        return id == 1346;
    }

    private getAngle(): number {
        return this.degrees + this.times360 * 360;
    }
    
    public applyTransform(transform: GroupTransform, info: TransformInfo): void {
        const angle = -this.getAngle() * info.movementAmount;

        const center = info.state.getCenterGroupPosition(this.centerGroupId);
        if (!center) {
            transform.rotateOnlyObject(angle);
            return;
        }

        transform.rotate(angle, center, this.lockObjectRot);
    }

    public getSpecialCenterGroupId(): number | null {
        return this.centerGroupId;
    }

    public getDependentCenterGroupIds(): Set<number> {
        return new Set<number>([this.centerGroupId]);
    }
}