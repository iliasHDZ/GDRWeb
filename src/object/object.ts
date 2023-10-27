import { Renderer } from "../renderer";
import { GDObjectData, ZLayer } from "./object-data";

export class GDObject {
    public id: number;

    public x: number;
    public y: number;

    public xflip: boolean;
    public yflip: boolean;
    
    public rotation: number;
    public scale: number;
    
    public zorder: number;
    public zlayer: ZLayer;
    
    public baseCol: number;
    public detailCol: number;

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
        case -3: return ZLayer.B4;
        case -1: return ZLayer.B3;
        case  1: return ZLayer.B2;
        case  3: return ZLayer.B1;
        case  5: return ZLayer.T1;
        case  7: return ZLayer.T2;
        case  9: return ZLayer.T3;
        default: return null;
        }
    }

    applyData(data: {}) {
        this.id       = GDObject.parse(data[1],  'number',  1);
        this.x        = GDObject.parse(data[2],  'number',  0);
        this.y        = GDObject.parse(data[3],  'number',  0);
        this.xflip    = GDObject.parse(data[4],  'boolean', false);
        this.yflip    = GDObject.parse(data[5],  'boolean', false);
        this.rotation = GDObject.parse(data[6],  'number',  0);
        this.scale    = GDObject.parse(data[32], 'number',  1);

        let def: GDObjectData = Renderer.objectData.getData(this.id);

        if (def) {
            this.zorder = GDObject.parse(data[25], 'number', def.zorder);
            this.zlayer = GDObject.getZLayerValue(GDObject.parse(data[24], 'number', null)) ?? def.zlayer;
            
            this.baseCol   = GDObject.parse(data[21], 'number', def.baseCol);
            this.detailCol = GDObject.parse(data[22], 'number', def.detailCol);
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