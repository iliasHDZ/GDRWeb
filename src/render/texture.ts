import { RenderContext } from "../context/context";

export class Texture {
    public texture: any;

    public width: number;
    public height: number;

    public loaded: boolean = false;

    ctx: RenderContext;

    constructor(ctx: RenderContext) {
        this.ctx = ctx;
    }

    load(path: string) {
        let img = new Image();

        let tex = this;
        
        console.log("LOADING IMAGE!");

        img.src = path;
        img.onload = () => {
            tex.texture = tex.ctx.loadTexture(img);

            tex.width  = img.width;
            tex.height = img.height;

            tex.loaded = true;

            console.log("IMAGE LOADED!");
            console.log(tex.texture);
        }
    }
}