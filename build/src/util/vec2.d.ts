export declare class Vec2 {
    x: number;
    y: number;
    constructor(x: number, y: number);
    add(vec: Vec2): Vec2;
    sub(vec: Vec2): Vec2;
    mul(vec: Vec2): Vec2;
    div(vec: Vec2): Vec2;
    neg(): Vec2;
    spritePixelsToUnits(spriteQuality: number): Vec2;
    equals(vec: Vec2): boolean;
    buffer(): number[];
}
