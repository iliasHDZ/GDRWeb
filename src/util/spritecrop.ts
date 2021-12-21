export class SpriteCrop {
    public x: number;
    public y: number;
    public w: number;
    public h: number;

    constructor(x: number, y: number, w: number, h: number) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    static fromObjectData(data: any): SpriteCrop {
        return new SpriteCrop(data.x, data.y, data.w, data.h);
    }
}