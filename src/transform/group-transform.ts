import { Vec2 } from "..";

export class GroupTransform {
    offset: Vec2;

    right: Vec2;
    up: Vec2;

    objRight: Vec2;
    objUp: Vec2;

    constructor() {
        this.offset = new Vec2(0, 0);
        this.right = new Vec2(1, 0);
        this.up = new Vec2(0, 1);
        this.objRight = new Vec2(1, 0);
        this.objUp = new Vec2(0, 1);
    }

    copy(): GroupTransform {
        let ret = new GroupTransform();
        ret.offset = this.offset;
        ret.right = this.right;
        ret.up = this.up;
        ret.objRight = this.objRight;
        ret.objUp = this.objUp;
        return ret;
    }

    transformPoint(vec: Vec2): Vec2 {
        return this.right.mul(new Vec2(vec.x, vec.x)).add(this.up.mul(new Vec2(vec.y, vec.y))).add(this.offset);
    }

    translate(vec: Vec2) {
        this.offset = this.offset.add(vec);
    }

    static rotateVector(vec: Vec2, cosv: number, sinv: number): Vec2 {
        return new Vec2(vec.x * cosv - vec.y * sinv, vec.x * sinv + vec.y * cosv);
    }

    rotate(angle: number, center: Vec2, lockObjRot: boolean) {
        const rads = angle / 180 * Math.PI;
        const cosv = Math.cos(rads);
        const sinv = Math.sin(rads);

        const rotvec = this.offset.sub(center);
        this.offset  = GroupTransform.rotateVector(rotvec, cosv, sinv).add(center);

        this.up    = GroupTransform.rotateVector(this.up,    cosv, sinv);
        this.right = GroupTransform.rotateVector(this.right, cosv, sinv);

        if (!lockObjRot) {
            this.objUp    = GroupTransform.rotateVector(this.objUp,    cosv, sinv);
            this.objRight = GroupTransform.rotateVector(this.objRight, cosv, sinv);
        }
    }
};