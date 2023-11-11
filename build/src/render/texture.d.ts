import { RenderContext } from "../context/context";
export declare class Texture {
    texture: any;
    width: number;
    height: number;
    loaded: boolean;
    onload: Function;
    ctx: RenderContext;
    constructor(ctx: RenderContext);
    load(path: string): void;
}
