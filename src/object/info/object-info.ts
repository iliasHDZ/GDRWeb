import { SpriteCrop, SpriteCropInfo } from "../../util/sprite";
import { Vec2 } from "../../util/vec2";
import { GDObject } from "../object";
import { PlistAtlasLoader } from "../plist-loader";
import { ObjectSpriteColor } from "./object-sprite";
import { ObjectSprite } from "./object-sprite";

export enum ZLayer {
    B4,
    B3,
    B2,
    B1,
    T1,
    T2,
    T3
}

export class GDObjectsInfo {
    public atlas: {[key: string]: SpriteCropInfo};
    public data: {[id: number]: GDObjectInfo};

    constructor(
        atlas: {[key: string]: SpriteCropInfo},
        data: {[id: number]: GDObjectInfo}
    ) {
        this.atlas = atlas;
        this.data = data;
    }

    public getData(id: number): GDObjectInfo {
        return this.data[id];
    }
};

export class GDObjectInfo {
    public zorder: number;
    public zlayer: ZLayer;

    public baseCol: number;
    public detailCol: number;

    public rootSprite: ObjectSprite | null;

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

    static fromJSON(data: any, atlas: {[key: string]: SpriteCropInfo}): GDObjectInfo {
        let obj = new GDObjectInfo();

        obj.zorder = data.default_z_order || -2;
        obj.zlayer = GDObject.getZLayerValue(data.default_z_layer);

        obj.baseCol   = data.default_base_color_channel ?? 1004;
        obj.detailCol = data.default_detail_color_channel ?? 0;

        if (data.texture) {
            obj.rootSprite = ObjectSprite.fromJSON(data, atlas);
        
            // TODO: Check if this is the right thing to do, Object 211 (and others) has the wrong color without this:
            if (obj.rootSprite) {
                let onlyDetail = true;
                obj.rootSprite.enumerateAll(sprite => {
                    if (sprite.colorType != ObjectSpriteColor.DETAIL)
                        onlyDetail = false;
                });

                if (onlyDetail)
                    obj.rootSprite.enumerateAll(sprite => {
                        sprite.colorType = ObjectSpriteColor.BASE;
                    });
            }
        }
        
        return obj;
    }

    static fromJSONList(list: any, atlas: {[key: string]: SpriteCropInfo}): {[id: number]: GDObjectInfo} {
        let ret: {[id: number]: GDObjectInfo} = {};

        for (let [k, v] of Object.entries(list)) {
            // ret[k] = this.fromObjectData(v);
            ret[k] = this.fromJSON(v, atlas);
        }

        return ret;
    }
}