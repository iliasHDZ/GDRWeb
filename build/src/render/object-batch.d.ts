import { RenderContext } from "../context/context";
import { SpriteCropInfo } from "../util/sprite";
import { Mat3 } from "../util/mat3";
import { TextureObject } from "./texture-object";
import { Texture } from "./texture";
export declare class ObjectBatch {
    objects: TextureObject[];
    buffer: any;
    ctx: RenderContext;
    mainTexture: Texture;
    secondTexture: Texture;
    constructor(ctx: RenderContext, mainTexture: Texture, secondTexture?: Texture);
    add(model: Mat3, color: number, sprite: SpriteCropInfo, groups: number[], hsvId: number): void;
    compile(): void;
}
