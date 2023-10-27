import { SpriteCrop, SpriteInfo } from "../util/sprite";
import { Vec2 } from "../util/vec2";
import { GDObject } from "./object";
import { PlistAtlasLoader } from "./plist-loader";

export enum ZLayer {
    B4,
    B3,
    B2,
    B1,
    T1,
    T2,
    T3
}

export class GDObjects {
    public atlas: {[key: string]: SpriteInfo};
    public data: {[id: number]: GDObjectData};

    constructor(
        atlas: {[key: string]: SpriteInfo},
        data: {[id: number]: GDObjectData}
    ) {
        this.atlas = atlas;
        this.data = data;
    }

    public getData(id: number): GDObjectData {
        return this.data[id];
    }
};

export class ObjectSprite {
    public sprite: SpriteInfo;
    public offset: Vec2 = new Vec2(0, 0);
    public rotation: number = 0;
    public xflip: boolean = false;
    public yflip: boolean = false;

    public xflipOffset: Vec2 = new Vec2(0, 0);
    public yflipOffset: Vec2 = new Vec2(0, 0);

    constructor(sprite: SpriteInfo) {
        this.sprite = sprite;
    }

    static fromRawData(atlas: {[key: string]: SpriteInfo}, osp: any): ObjectSprite {
        if (typeof(osp) == 'string') {
            if (!atlas[osp]) return null;

            return new ObjectSprite(atlas[osp]);
        } else {
            if (!atlas[osp.src]) return null;

            const sprite = new ObjectSprite(atlas[osp.src]);

            if (osp.offset)
                sprite.offset = new Vec2(osp.offset[0], osp.offset[1]);
            if (osp.xfoff)
                sprite.xflipOffset = new Vec2(osp.xfoff[0], osp.xfoff[1]);
            if (osp.yfoff)
                sprite.yflipOffset = new Vec2(osp.yfoff[0], osp.yfoff[1]);
            if (osp.rot)
                sprite.rotation = osp.rot;
            if (osp.xf)
                sprite.xflip = osp.xf;
            if (osp.yf)
                sprite.yflip = osp.yf;

            return sprite;
        }
    }

    static fromData(atlas: {[key: string]: SpriteInfo}, sprite: any): ObjectSprite[] {
        let sprites = [];
        if (Array.isArray(sprite)) {
            for (let osp of sprite) {
                let sp = ObjectSprite.fromRawData(atlas, osp);
                if (sp) sprites.push(sp);
            }
        } else {
            let sp = ObjectSprite.fromRawData(atlas, sprite);
            if (sp) sprites.push(sp);
        }

        return sprites;
    }
};

export class GDObjectData {
    public zorder: number;
    public zlayer: ZLayer;

    public baseCol: number;
    public detailCol: number;

    public baseSprites: ObjectSprite[]   = [];
    public detailSprites: ObjectSprite[] = [];

    public spriteNoColor: boolean;
    public black: boolean;
    public blackBase: boolean;
    public repeat: boolean;
    public repeatSymmetry: boolean;

    // public width: number;
    // public height: number;

    static getDataZLayer(z: number, fromGD: boolean = false): ZLayer {
        switch (z) {
        case -4: return ZLayer.B4;
        case -3: return ZLayer.B3;
        case -2: return ZLayer.B2;
        case -1: return ZLayer.B1;
        case 1:  return ZLayer.T1;
        case 2:  return ZLayer.T2;
        case 3:  return ZLayer.T3;

        default: return ZLayer.B1;
        }
    }

    static lastSpriteId: number = 0;

    /*static fromObjectData(data: any): GDObjectData {
        let obj = new GDObjectData();

        obj.zorder = data.zorder || -2;
        obj.zlayer = this.getDataZLayer(data.zlayer);

        obj.baseCol   = data.mainCol || 1004;
        obj.detailCol = data.secCol  || 1;

        let sprs: SpriteInfo[] = [];

        for (let s of ['sprite_i', 'sprite_a', 'sprite_b', 'sprite_l'])
            if (data[s]) {
                const crop = SpriteCrop.fromObjectData(data[s]);
                sprs.push(new SpriteInfo("null", crop, new Vec2(crop.w, crop.h), new Vec2(0, 0), false));
            }

        if (sprs.length >= 1) {
            obj.baseSprites = [sprs[0]];

            obj.baseSprites[0].crop.id = this.lastSpriteId++;
        
            // obj.width  = obj.baseSprites[0].crop.w;
            // obj.height = obj.baseSprites[0].crop.h;
        }
        
        if (sprs.length >= 2) {
            obj.detailSprites = [sprs[1]];

            obj.detailSprites[0].crop.id = this.lastSpriteId++;
        }

        obj.spriteNoColor = !(!data.sprite_i);

        return obj;
    }*/

    static fromNewObjectData(data: any, atlas: {[key: string]: SpriteInfo}): GDObjectData {
        let obj = new GDObjectData();

        obj.zorder = data.zorder || -2;
        obj.zlayer = GDObject.getZLayerValue(data.zlayer);

        obj.baseCol   = data.baseColor ?? 1004;
        obj.detailCol = data.detailColor ?? 1;
        obj.black     = data.black ?? false;
        obj.blackBase = data.blackBase ?? false;
        obj.repeat    = data.repeat ?? false;
        obj.repeatSymmetry = data.symmetry ?? true;

        if (data.baseTex)
            obj.baseSprites = ObjectSprite.fromData(atlas, data.baseTex);

        if (data.detailTex)
            obj.detailSprites = ObjectSprite.fromData(atlas, data.detailTex);

        obj.spriteNoColor = false;

        return obj;
    }

    static fromObjectDataList(list: any, atlas: {[key: string]: SpriteInfo}): {[id: number]: GDObjectData} {
        let ret: {[id: number]: GDObjectData} = {};

        for (let [k, v] of Object.entries(list)) {
            // ret[k] = this.fromObjectData(v);
            ret[k] = this.fromNewObjectData(v, atlas);
        }

        return ret;
    }
}