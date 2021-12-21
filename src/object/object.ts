import { GDRWebRenderer } from "../renderer";
import { GDObjectData, ZLayer } from "./object-data";

export class GDObject {
    public id: number;

    public x: number;
    public y: number;

    public xflip: boolean;
    public yflip: boolean;
    
    public rotation: number;
    
    public zorder: number;
    public zlayer: ZLayer;

    static parse(data: string, type: string, def: any): any {
        if (!data) return def;

        switch (type) {
            case 'number':  return +data;
            case 'boolean': return data == '1';
            default:        return def;
        }
    }

    static getZLayerValue(z: number): ZLayer {
        switch (z) {
            case -3: ZLayer.B4;
            case -1: ZLayer.B3;
            case  1: ZLayer.B2;
            case  3: ZLayer.B1;
            case  5: ZLayer.T1;
            case  7: ZLayer.T2;
            case  9: ZLayer.T3;
            default: return null;
        }
    }

    static fromLevelData(data: {}): GDObject {
        let o = new GDObject();

        o.id       = this.parse(data[1], 'number',  1);
        o.x        = this.parse(data[2], 'number',  0);
        o.y        = this.parse(data[3], 'number',  0);
        o.xflip    = this.parse(data[4], 'boolean', false);
        o.yflip    = this.parse(data[5], 'boolean', false);
        o.rotation = this.parse(data[6], 'number',  0);

        let def: GDObjectData = GDRWebRenderer.objectData[o.id];

        if (def) {
            o.zorder = this.parse(data[25], 'number', def.zorder);
            o.zlayer = this.getZLayerValue(data[26]) || def.zlayer;
        }

        return o;
    }

    static compareZOrder(o1: GDObject, o2: GDObject) {
        if (o1.zlayer != o2.zlayer) return o1.zlayer - o2.zlayer;

        return o1.zorder - o2.zorder;
    }
}