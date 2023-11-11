import { Mat3 } from "../util/mat3";
import { SpriteCropInfo } from "../util/sprite";
export declare class TextureObject {
    model: Mat3;
    color: number;
    sprite: SpriteCropInfo;
    secondTexture: boolean;
    groups: number[];
    hsvId: number;
    constructor(model: Mat3, color: number, sprite: SpriteCropInfo, groups: number[], hsvId: number, secondTexture?: boolean);
}
