import { Mat3 } from "../util/mat3";
import { SpriteInfo } from "../util/sprite";

export class TextureObject {
    public model: Mat3;
    public color: number;
    public sprite: SpriteInfo;
    public secondTexture: boolean;

    constructor(model: Mat3, color: number, sprite: SpriteInfo, secondTexture = false) {
        this.model    = model;
        this.color    = color;
        this.sprite   = sprite;
        secondTexture = secondTexture;
    }
}