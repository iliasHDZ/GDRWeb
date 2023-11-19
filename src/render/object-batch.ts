import { RenderContext } from "../context/context";
import { SpriteCrop, SpriteCropInfo } from "../util/sprite";
import { Color } from "../util/color";
import { Mat3 } from "../util/mat3";

import { TextureObject } from "./texture-object";
import { Texture } from "./texture";

export class ObjectBatch {
    public objects: TextureObject[] = [];
    public buffer: any;

    ctx: RenderContext;

    mainTexture: Texture;
    secondTexture: Texture;

    constructor(ctx: RenderContext, mainTexture: Texture, secondTexture: Texture = null) {
        this.mainTexture   = mainTexture;
        this.secondTexture = secondTexture;
        this.ctx = ctx;
    }

    add(model: Mat3, color: number, sprite: SpriteCropInfo, groups: number[], hsvId: number, black: boolean, trigger: boolean) {
        this.objects.push(new TextureObject(model, color, sprite, groups, hsvId, black, trigger));
    }

    compile() {
        this.buffer = this.ctx.compileObjects(this);
    }
}