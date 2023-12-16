import { Mat3 } from "../util/mat3";
import { SpriteCropInfo } from "../util/sprite";
import { Vec2 } from "../util/vec2";

export class TextureObject {
    public model: Mat3;
    public objectPos: Vec2;
    public color: number;
    public sprite: SpriteCropInfo;
    public secondTexture: boolean;
    public groups: number[];
    public transformId: number;
    public hsvId: number;
    public black: boolean;
    public trigger: boolean;

    constructor(model: Mat3, color: number, sprite: SpriteCropInfo, groups: number[], transformId: number, objectPos: Vec2, hsvId: number, black: boolean, trigger: boolean, secondTexture = false) {
        this.model    = model;
        this.color    = color;
        this.sprite   = sprite;
        this.groups   = groups;
        this.hsvId    = hsvId;
        this.black    = black;
        this.trigger  = trigger;
        // Is this value even used?
        this.secondTexture = secondTexture;
        this.transformId = transformId;
        this.objectPos = objectPos;
    }

    sameAs(b: TextureObject): boolean {
        const a = this;
        return (
            a.model.equals(b.model) &&
            a.objectPos.equals(b.objectPos) &&
            a.color == b.color &&
            a.sprite.equals(b.sprite) &&
            a.secondTexture == b.secondTexture &&
            a.transformId == b.transformId &&
            a.hsvId == b.hsvId &&
            a.black == b.black &&
            a.trigger == b.trigger
        );
    }
}