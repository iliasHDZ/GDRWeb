import { RenderContext } from "../context/context";
import { Color } from "../util/color";
import { Mat3 } from "../util/mat3";

import { TextureObject } from "./texture-object";

export class ObjectCollection {
    public objects: TextureObject[] = [];
    public buffer: any;

    ctx: RenderContext;

    constructor(ctx: RenderContext) {
        this.ctx = ctx;
    }

    add(model: Mat3, color: Color) {
        this.objects.push(new TextureObject(model, color));
    }

    compile() {
        this.buffer = this.ctx.compileObjects(this);
    }
}