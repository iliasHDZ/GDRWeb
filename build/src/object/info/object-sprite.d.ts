import { Vec2 } from "../../util/vec2";
import { Mat3 } from "../../util/mat3";
import { SpriteCropInfo } from "../../util/sprite";
export declare enum ObjectSpriteColor {
    BASE = 0,
    DETAIL = 1,
    BLACK = 2
}
export declare class ObjectSprite {
    position: Vec2;
    size: Vec2;
    scale: Vec2;
    rotation: number;
    anchor: Vec2;
    prevPosition: Vec2;
    prevSize: Vec2;
    prevScale: Vec2;
    prevRotation: number;
    prevAnchor: Vec2;
    children: ObjectSprite[];
    parent: ObjectSprite | null;
    modelMatrix: Mat3 | null;
    renderModelMatrix: Mat3 | null;
    colorType: ObjectSpriteColor;
    sprite: SpriteCropInfo;
    depth: number;
    constructor(sprite: SpriteCropInfo);
    static fromJSON(obj: any, atlas: {
        [key: string]: SpriteCropInfo;
    }): ObjectSprite | null;
    enumerateAll(func: (node: ObjectSprite) => void): void;
    enumerateAllByDepth(func: (node: ObjectSprite) => void): void;
    addChild(node: ObjectSprite): void;
    calcModelMatrix(): [Mat3, Mat3];
    updateModelMatrix(): void;
    getModelMatrix(): Mat3;
    getRenderModelMatrix(): Mat3;
}
