import { Mat3 } from "../util/mat3";
import { Color } from "../util/color";
import { SpriteCrop } from "../util/spritecrop";

export class TextureObject {
    public model: Mat3;
    public color: number;
    public sprite: SpriteCrop;

    constructor(model: Mat3, color: number, sprite: SpriteCrop) {
        this.model  = model;
        this.color  = color;
        this.sprite = sprite;
    }
}