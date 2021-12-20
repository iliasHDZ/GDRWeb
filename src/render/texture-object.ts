import { Mat3 } from "../util/mat3";
import { Color } from "../util/color";

export class TextureObject {
    public model: Mat3;
    public color: Color;

    constructor(model: Mat3, color: Color) {
        this.model = model;
        this.color = color;
    }
}