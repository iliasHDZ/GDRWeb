"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GDObjectData = exports.ObjectSprite = exports.GDObjects = exports.ZLayer = void 0;
const vec2_1 = require("../util/vec2");
const object_1 = require("./object");
var ZLayer;
(function (ZLayer) {
    ZLayer[ZLayer["B4"] = 0] = "B4";
    ZLayer[ZLayer["B3"] = 1] = "B3";
    ZLayer[ZLayer["B2"] = 2] = "B2";
    ZLayer[ZLayer["B1"] = 3] = "B1";
    ZLayer[ZLayer["T1"] = 4] = "T1";
    ZLayer[ZLayer["T2"] = 5] = "T2";
    ZLayer[ZLayer["T3"] = 6] = "T3";
})(ZLayer = exports.ZLayer || (exports.ZLayer = {}));
class GDObjects {
    constructor(atlas, data) {
        this.atlas = atlas;
        this.data = data;
    }
    getData(id) {
        return this.data[id];
    }
}
exports.GDObjects = GDObjects;
;
class ObjectSprite {
    constructor(sprite) {
        this.offset = new vec2_1.Vec2(0, 0);
        this.rotation = 0;
        this.xflip = false;
        this.yflip = false;
        this.xflipOffset = new vec2_1.Vec2(0, 0);
        this.yflipOffset = new vec2_1.Vec2(0, 0);
        this.sprite = sprite;
    }
    static fromRawData(atlas, osp) {
        if (typeof (osp) == 'string') {
            if (!atlas[osp])
                return null;
            return new ObjectSprite(atlas[osp]);
        }
        else {
            if (!atlas[osp.src])
                return null;
            const sprite = new ObjectSprite(atlas[osp.src]);
            if (osp.offset)
                sprite.offset = new vec2_1.Vec2(osp.offset[0], osp.offset[1]);
            if (osp.xfoff)
                sprite.xflipOffset = new vec2_1.Vec2(osp.xfoff[0], osp.xfoff[1]);
            if (osp.yfoff)
                sprite.yflipOffset = new vec2_1.Vec2(osp.yfoff[0], osp.yfoff[1]);
            if (osp.rot)
                sprite.rotation = osp.rot;
            if (osp.xf)
                sprite.xflip = osp.xf;
            if (osp.yf)
                sprite.yflip = osp.yf;
            return sprite;
        }
    }
    static fromData(atlas, sprite) {
        let sprites = [];
        if (Array.isArray(sprite)) {
            for (let osp of sprite) {
                let sp = ObjectSprite.fromRawData(atlas, osp);
                if (sp)
                    sprites.push(sp);
            }
        }
        else {
            let sp = ObjectSprite.fromRawData(atlas, sprite);
            if (sp)
                sprites.push(sp);
        }
        return sprites;
    }
}
exports.ObjectSprite = ObjectSprite;
;
class GDObjectData {
    constructor() {
        this.baseSprites = [];
        this.detailSprites = [];
    }
    // public width: number;
    // public height: number;
    static getDataZLayer(z, fromGD = false) {
        switch (z) {
            case -4: return ZLayer.B4;
            case -3: return ZLayer.B3;
            case -2: return ZLayer.B2;
            case -1: return ZLayer.B1;
            case 1: return ZLayer.T1;
            case 2: return ZLayer.T2;
            case 3: return ZLayer.T3;
            default: return ZLayer.B1;
        }
    }
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
    static fromNewObjectData(data, atlas) {
        let obj = new GDObjectData();
        obj.zorder = data.zorder || -2;
        obj.zlayer = object_1.GDObject.getZLayerValue(data.zlayer);
        obj.baseCol = data.baseColor ?? 1004;
        obj.detailCol = data.detailColor ?? 1;
        obj.black = data.black ?? false;
        obj.blackBase = data.blackBase ?? false;
        obj.repeat = data.repeat ?? false;
        obj.repeatSymmetry = data.symmetry ?? true;
        if (data.baseTex)
            obj.baseSprites = ObjectSprite.fromData(atlas, data.baseTex);
        if (data.detailTex)
            obj.detailSprites = ObjectSprite.fromData(atlas, data.detailTex);
        obj.spriteNoColor = false;
        return obj;
    }
    static fromObjectDataList(list, atlas) {
        let ret = {};
        for (let [k, v] of Object.entries(list)) {
            // ret[k] = this.fromObjectData(v);
            ret[k] = this.fromNewObjectData(v, atlas);
        }
        return ret;
    }
}
exports.GDObjectData = GDObjectData;
GDObjectData.lastSpriteId = 0;
