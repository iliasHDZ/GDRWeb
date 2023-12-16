import { TransformManager } from "../../transform/transform-manager";
import { easingFunction } from "../../util/easing";
import { GameObject } from "../object";
import { TransformTrigger } from "./transform-trigger";

export class RotateTrigger extends TransformTrigger {
    degrees: number;
    times360: number;

    lockObjectRot: boolean;

    centerGroupId: number;

    applyData(data: {}): void {
        super.applyData(data);
        
        this.degrees = GameObject.parse(data[68], 'number', 0);
        this.times360 = GameObject.parse(data[69], 'number', 0);

        this.lockObjectRot = GameObject.parse(data[70], 'boolean', false);

        this.centerGroupId = GameObject.parse(data[71], 'number', 0);
    }

    getAngle(): number {
        return this.degrees + this.times360 * 360;
    }

    public rotationAfterDelta(deltaTime: number, _1: number, _2: TransformManager): number {
        return this.getChange(deltaTime) * this.getAngle();
    }

    static isOfType(id: number): boolean {
        return id == 1346;
    }
}