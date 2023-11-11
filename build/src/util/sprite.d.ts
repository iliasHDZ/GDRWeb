import { Vec2 } from "./vec2";
export declare class SpriteCrop {
    x: number;
    y: number;
    w: number;
    h: number;
    id: number;
    constructor(x: number, y: number, w: number, h: number);
    getSize(): Vec2;
    static fromObjectData(data: any): SpriteCrop;
    static fromTextureRect(data: string): SpriteCrop;
}
export declare class SpriteCropInfo {
    name: string;
    sheet: number;
    crop: SpriteCrop;
    size: Vec2;
    offset: Vec2;
    rotated: boolean;
    constructor(name: string, crop: SpriteCrop, size: Vec2, offset: Vec2, rotated: boolean);
}
