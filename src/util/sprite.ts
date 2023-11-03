import { Vec2 } from "./vec2";

function parseVec(str: string) {
    let split = str.substring(1, str.length - 1).split(',');
    return [split[0], split[1]];
}

export class SpriteCrop {
    public x: number;
    public y: number;
    public w: number;
    public h: number;

    public id: number;

    constructor(x: number, y: number, w: number, h: number) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    getSize(): Vec2 {
        return new Vec2(this.w, this.h);
    }

    static fromObjectData(data: any): SpriteCrop {
        return new SpriteCrop(data.x, data.y, data.w, data.h);
    }

    static fromTextureRect(data: string): SpriteCrop {
        let sp = parseVec(data);

        let org  = parseVec(sp[0]);
        let size = parseVec(sp[1]);

        return new SpriteCrop(+org[0], +org[1], +size[0], +size[1])
    }
}

export class SpriteCropInfo {
    public name: string;
    public sheet: number;
    public crop: SpriteCrop;
    public size: Vec2;
    public offset: Vec2;
    public rotated: boolean;

    constructor(name: string, crop: SpriteCrop, size: Vec2, offset: Vec2, rotated: boolean) {
        this.name = name;
        this.crop = crop;
        this.size = size;
        this.offset = offset;
        this.rotated = rotated;
    }
}