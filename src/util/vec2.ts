export class Vec2 {
    public x: number;
    public y: number;

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

    neg(): Vec2 {
        return new Vec2(-this.x, -this.y);
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