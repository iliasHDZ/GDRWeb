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

    applyData(data: {}) {
        this.id       = GDObject.parse(data[1], 'number',  1);
        this.x        = GDObject.parse(data[2], 'number',  0);
        this.y        = GDObject.parse(data[3], 'number',  0);
        this.xflip    = GDObject.parse(data[4], 'boolean', false);
        this.yflip    = GDObject.parse(data[5], 'boolean', false);
        this.rotation = GDObject.parse(data[6], 'number',  0);

        let def: GDObjectData = GDRWebRenderer.objectData[this.id];

        if (def) {
            this.zorder = GDObject.parse(data[25], 'number', def.zorder);
            this.zlayer = GDObject.getZLayerValue(data[26]) || def.zlayer;
        }
    }

    /*static fromLevelData(data: {}): GDObject {
        let id = data[1] || 1;

        let o: GDObject;

        if (SpeedPortal.isOfType(id))
            o = new SpeedPortal();

        o.applyData(data);
        return o;
    }*/

    static compareZOrder(o1: GDObject, o2: GDObject) {
        if (o1.zlayer != o2.zlayer) return o1.zlayer - o2.zlayer;

        return o1.zorder - o2.zorder;
    }
}