import { RenderContext } from "../context/context";

export class Texture {
    public texture: any;

    public width: number = 0;
    public height: number = 0;

    public loaded: boolean = false;

    public onload: Function | null = null;

    ctx: RenderContext;

    constructor(ctx: RenderContext) {
        this.ctx = ctx;
    }

    load(path: string) {
        let img = new Image();

        let tex = this;

        img.src = path;
        img.onload = () => {
            tex.texture = tex.ctx.loadTexture(img);

            tex.width  = img.width;
            tex.height = img.height;

            tex.loaded = true;

            if (tex.onload)
                tex.onload();
        }
    }
}