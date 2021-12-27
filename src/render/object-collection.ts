import { RenderContext } from "../context/context";
import { SpriteCrop } from "../util/spritecrop";
import { Color } from "../util/color";
import { Mat3 } from "../util/mat3";

import { TextureObject } from "./texture-object";
import { Texture } from "./texture";

export class ObjectCollection {
    public objects: TextureObject[] = [];
    public buffer: any;

    ctx: RenderContext;

    texture: Texture;

    constructor(ctx: RenderContext, texture: Texture) {
        this.texture = texture;
        this.ctx     = ctx;
    }

    add(model: Mat3, color: number, sprite: SpriteCrop) {
        this.objects.push(new TextureObject(model, color, sprite));
    }

    compile() {
        this.buffer = this.ctx.compileObjects(this);
    }
}