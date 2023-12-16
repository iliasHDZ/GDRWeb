import { TransformManager } from "../../transform/transform-manager";
import { Vec2 } from "../../util/vec2";
import { GameObject } from "../object";
import { TransformTrigger } from "./transform-trigger";

export class MoveTrigger extends TransformTrigger {
    moveX: number;
    moveY: number;

    lockToPlayerX: boolean;
    lockToPlayerY: boolean;

    useTarget: boolean;
    moveTargetId: number;
    shouldMoveX: boolean;
    shouldMoveY: boolean;

    applyData(data: {}): void {
        super.applyData(data);

        this.moveX = GameObject.parse(data[28], 'number', 0);
        this.moveY = GameObject.parse(data[29], 'number', 0);

        this.lockToPlayerX = GameObject.parse(data[58], 'boolean', false);
        this.lockToPlayerY = GameObject.parse(data[59], 'boolean', false);

        this.useTarget = GameObject.parse(data[100], 'boolean', false);
        this.moveTargetId = GameObject.parse(data[71], 'number', 0);

        const targetCoordMask = GameObject.parse(data[101], 'number', false);

        this.shouldMoveX = true;
        this.shouldMoveY = true;

        if (targetCoordMask == 1)
            this.shouldMoveY = false;
        else if (targetCoordMask == 2)
            this.shouldMoveX = false;
    }

    getDestinationOffset(startTime: number, manager: TransformManager): Vec2 {
        if (!this.useTarget)
            return new Vec2(this.moveX, this.moveY);

        const srcPoint = manager.centerGroupPosAt(this.targetGroupId, startTime);
        if (srcPoint == null)
            return new Vec2(0, 0);

        const dstPoint = manager.centerGroupPosAt(this.moveTargetId, startTime);
        if (dstPoint == null)
            return new Vec2(0, 0);

        const offset = dstPoint.sub(srcPoint);
        return new Vec2(this.shouldMoveX ? offset.x : 0, this.shouldMoveY ? offset.y : 0);
    }

    public offsetAfterDelta(deltaTime: number, startTime: number, manager: TransformManager): Vec2 {
        let offset = this.getDestinationOffset(startTime, manager);

        const change = this.getChange(deltaTime);
        offset = offset.mul(new Vec2(change, change));

        if (this.level == null)
            return offset;

        let startPos: number;
        let afterPos: number;
        if (this.lockToPlayerX || this.lockToPlayerY) {
            startPos = this.level.posAt(startTime);
            afterPos = this.level.posAt(startTime + deltaTime);
        }

        if (this.lockToPlayerX)
            offset.x = afterPos - startPos;

        if (this.lockToPlayerY)
            offset.y = this.level.gameStateAtPos(afterPos).approxYPos - this.level.gameStateAtPos(startPos).approxYPos;

        return offset;
    }

    static isOfType(id: number): boolean {
        return id == 901;
    }
}