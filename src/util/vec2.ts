export class Vec2 {
    public readonly x: number;
    public readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add(vec: Vec2): Vec2 {
        return new Vec2(this.x + vec.x, this.y + vec.y);
    }

    sub(vec: Vec2): Vec2 {
        return new Vec2(this.x - vec.x, this.y - vec.y);
    }

    mul(vec: Vec2): Vec2 {
        return new Vec2(this.x * vec.x, this.y * vec.y);
    }

    div(vec: Vec2): Vec2 {
        return new Vec2(this.x / vec.x, this.y / vec.y);
    }

    addn(v: number): Vec2 {
        return new Vec2(this.x + v, this.y + v);
    }

    subn(v: number): Vec2 {
        return new Vec2(this.x - v, this.y - v);
    }

    muln(v: number): Vec2 {
        return new Vec2(this.x * v, this.y * v);
    }

    divn(v: number): Vec2 {
        return new Vec2(this.x / v, this.y / v);
    }

    neg(): Vec2 {
        return new Vec2(-this.x, -this.y);
    }

    get lengthSquared(): number {
        return this.x * this.x + this.y * this.y;
    }

    get length(): number {
        return Math.sqrt(this.lengthSquared);
    }

    normalize(): Vec2 {
        return this.divn(this.length);
    }

    spritePixelsToUnits(spriteQuality: number): Vec2 {
        return new Vec2(this.x / spriteQuality * 30, this.y / spriteQuality * 30);
    }

    equals(vec: Vec2): boolean {
        return this.x == vec.x && this.y == vec.y;
    }

    buffer() {
        return [this.x, this.y];
    }
}