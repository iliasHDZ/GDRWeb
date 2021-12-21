import { SpriteCrop } from "../util/spritecrop";

export enum ZLayer {
    B4,
    B3,
    B2,
    B1,
    T1,
    T2,
    T3
}

export class GDObjectData {
    public zorder: number;
    public zlayer: ZLayer;

    public baseCol: number;
    public detailCol: number;

    public baseSprite: SpriteCrop   = null;
    public detailSprite: SpriteCrop = null;

    public width: number;
    public height: number;

    static getDataZLayer(z: number): ZLayer {
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

    static fromObjectData(data: any): GDObjectData {
        let obj = new GDObjectData();

        obj.zorder = data.zorder || -2;
        obj.zlayer = this.getDataZLayer(data.zlayer);

        obj.baseCol   = data.mainCol || 1004;
        obj.detailCol = data.secCol  || 1;

        let sprs: SpriteCrop[] = [];

        for (let s of ['sprite_i', 'sprite_a', 'sprite_b', 'sprite_l'])
            if (data[s])
                sprs.push(SpriteCrop.fromObjectData(data[s]));

        if (sprs.length >= 1) {
            obj.baseSprite = sprs[0];
        
            obj.width  = obj.baseSprite.w;
            obj.height = obj.baseSprite.h;
        }
        
        if (sprs.length >= 2)
            obj.detailSprite = sprs[1];

        return obj;
    }

    static fromObjectDataList(list: any): {} {
        let ret = {};

        for (let [k, v] of Object.entries(list))
            ret[k] = this.fromObjectData(v);

        return ret;
    }
}