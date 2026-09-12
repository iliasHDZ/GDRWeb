import { GroupTransform } from "../../transform/group-transform";
import { TransformAction, TransformInfo, TransformState } from "../../transform/transform";
import { TransformManager } from "../../transform/transform-manager";
import { Vec2 } from "../../util/vec2";
import { GameObject, ObjectProperties, ObjectPropertyReader } from "../object";
import { TransformTrigger } from "./transform-trigger";

export class MoveTrigger extends TransformTrigger {
    moveX: number = 0;
    moveY: number = 0;

    lockToPlayerX: boolean = false;
    lockToPlayerY: boolean = false;
    modX: number = 1;
    modY: number = 1;

    centerGroupId: number = 0;
    moveTargetId: number = 0;
    shouldMoveX: boolean = false;
    shouldMoveY: boolean = false;

    targetMode: boolean = false;
    directionMode: boolean = false;

    directionModeDistance: number = 0;

    applyProperties(rd: ObjectPropertyReader): void {
        super.applyProperties(rd);

        this.moveX = rd.number(28, 0);
        this.moveY = rd.number(29, 0);

        this.lockToPlayerX = rd.bool(58, false);
        this.lockToPlayerY = rd.bool(59, false);
        this.modX = rd.number(143, 1);
        this.modY = rd.number(144, 1);

        const targetCoordMask = rd.number(101, 0);
        this.shouldMoveX = targetCoordMask != 1;
        this.shouldMoveY = targetCoordMask != 2;

        this.centerGroupId = rd.number(395, 0);
        this.moveTargetId = rd.number(71, 0);

        this.targetMode = rd.bool(100, false);
        this.directionMode = rd.bool(394, false);

        this.directionModeDistance = rd.number(396, 0);
    }

    getOffset(state: TransformState): Vec2 {
        const vectorMode = this.targetMode || this.directionMode;
        if (!vectorMode)
            return new Vec2(this.moveX, this.moveY);

        const startGroupId = this.centerGroupId != 0 ? this.centerGroupId : this.targetGroupId;

        const startPoint = state.getCenterGroupPosition(startGroupId);
        if (startPoint == null)
            return new Vec2(0, 0);

        const endPoint = state.getCenterGroupPosition(this.moveTargetId);
        if (endPoint == null)
            return new Vec2(0, 0);

        let offset = endPoint.sub(startPoint);
        if (this.directionMode) {
            const length = offset.length;
            if (length == 0)
                return new Vec2(0, 0);
            
            offset = offset.divn(length).muln(this.directionModeDistance);
        }

        return new Vec2(this.shouldMoveX ? offset.x : 0, this.shouldMoveY ? offset.y : 0);
    }

    static isOfType(id: number): boolean {
        return id == 901;
    }

    public applyTransform(transform: GroupTransform, info: TransformInfo): void {
        let lockX: number | null = null;
        let lockY: number | null = null;

        if (this.lockToPlayerX)
            lockX = info.playerMovement.x;
        if (this.lockToPlayerY)
            lockY = info.playerMovement.y;

        let offset: Vec2 = new Vec2(0, 0);

        if (lockX == null || lockY == null)
            offset = this.getOffset(info.state).muln(info.movementAmount);

        offset = new Vec2(lockX ?? offset.x, lockY ?? offset.y);

        transform.translate(offset);
    }

    public getDependentCenterGroupIds(): Set<number> {
        const ret = new Set<number>();

        if (this.targetMode || this.directionMode) {
            ret.add(this.centerGroupId != 0 ? this.centerGroupId : this.targetGroupId);
            ret.add(this.moveTargetId);
        }

        return ret;
    }
}