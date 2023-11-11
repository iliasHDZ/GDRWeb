"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GDObjectInfo = exports.GDObjectsInfo = exports.ZLayer = void 0;
const object_1 = require("../object");
const object_sprite_1 = require("./object-sprite");
const object_sprite_2 = require("./object-sprite");
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
class GDObjectsInfo {
    constructor(atlas, data) {
        this.atlas = atlas;
        this.data = data;
    }
    getData(id) {
        return this.data[id];
    }
}
exports.GDObjectsInfo = GDObjectsInfo;
;
class GDObjectInfo {
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
    static fromJSON(data, atlas) {
        let obj = new GDObjectInfo();
        obj.zorder = data.default_z_order || -2;
        obj.zlayer = object_1.GDObject.getZLayerValue(data.default_z_layer);
        obj.baseCol = data.default_base_color_channel ?? 1004;
        obj.detailCol = data.default_detail_color_channel ?? 0;
        if (data.texture) {
            obj.rootSprite = object_sprite_2.ObjectSprite.fromJSON(data, atlas);
            // TODO: Check if this is the right thing to do, Object 211 (and others) has the wrong color without this:
            if (obj.rootSprite) {
                let onlyDetail = true;
                obj.rootSprite.enumerateAll(sprite => {
                    if (sprite.colorType != object_sprite_1.ObjectSpriteColor.DETAIL)
                        onlyDetail = false;
                });
                if (onlyDetail)
                    obj.rootSprite.enumerateAll(sprite => {
                        sprite.colorType = object_sprite_1.ObjectSpriteColor.BASE;
                    });
            }
        }
        return obj;
    }
    static fromJSONList(list, atlas) {
        let ret = {};
        for (let [k, v] of Object.entries(list)) {
            // ret[k] = this.fromObjectData(v);
            ret[k] = this.fromJSON(v, atlas);
        }
        return ret;
    }
}
exports.GDObjectInfo = GDObjectInfo;
GDObjectInfo.lastSpriteId = 0;
