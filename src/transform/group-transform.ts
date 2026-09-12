import { Vec2 } from "..";

export class GroupTransform {
    offset:   Vec2 = new Vec2(0, 0);
    right:    Vec2 = new Vec2(1, 0);
    up:       Vec2 = new Vec2(0, 1);
    objRight: Vec2 = new Vec2(1, 0);
    objUp:    Vec2 = new Vec2(0, 1);

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

    rotateOnlyObjectCosSin(cosv: number, sinv: number) {
        this.objRight = GroupTransform.rotateVector(this.objRight, cosv, sinv);
        this.objUp    = GroupTransform.rotateVector(this.objUp,    cosv, sinv);
    }

    rotateOnlyObject(angle: number) {
        const rads = angle / 180 * Math.PI;
        this.rotateOnlyObjectCosSin(Math.cos(rads), Math.sin(rads));
    }

    rotate(angle: number, center: Vec2, lockObjRot: boolean) {
        const rads = angle / 180 * Math.PI;
        const cosv = Math.cos(rads);
        const sinv = Math.sin(rads);

        const rotvec = this.offset.sub(center);
        this.offset  = GroupTransform.rotateVector(rotvec, cosv, sinv).add(center);

        this.right = GroupTransform.rotateVector(this.right, cosv, sinv);
        this.up    = GroupTransform.rotateVector(this.up,    cosv, sinv);

        if (!lockObjRot)
            this.rotateOnlyObjectCosSin(cosv, sinv);
    }

    scaleOnlyObject(scale: Vec2) {
        this.objRight = this.objRight.muln(scale.x);
        this.objUp    = this.objUp.muln(scale.y);
    }

    scale(scale: Vec2, center: Vec2, moveOnly: boolean) {
        const vector = this.offset.sub(center);
        this.offset  = vector.mul(scale).add(center);
        
        this.right = this.right.muln(scale.x);
        this.up    = this.up.muln(scale.y);

        if (!moveOnly)
            this.scaleOnlyObject(scale);
    }
};