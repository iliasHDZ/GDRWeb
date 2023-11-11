import { Mat3 } from "../util/mat3";
import { SpriteCropInfo } from "../util/sprite";

export class TextureObject {
    public model: Mat3;
    public color: number;
    public sprite: SpriteCropInfo;
    public secondTexture: boolean;
    public groups: number[];
    public hsvId: number;

    constructor(model: Mat3, color: number, sprite: SpriteCropInfo, groups: number[], hsvId: number, secondTexture = false) {
        this.model    = model;
        this.color    = color;
        this.sprite   = sprite;
        this.groups   = groups;
        this.hsvId    = hsvId;
        // Is this value even used?
        this.secondTexture = secondTexture;
    }
}