import { Renderer } from "../renderer";
import { GDObjectInfo, ZLayer } from "./info/object-info";
import { ObjectSpriteColor } from "./info/object-sprite";
import { Mat3 } from "../util/mat3";
import { Vec2 } from "..";
import { HSVShift } from "../util/hsvshift";

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

    public groups: number[];
    public groupComb: number;
    
    public baseCol: number;
    public detailCol: number;

    public baseHSVShift: HSVShift | null = null;
    public detailHSVShift: HSVShift | null = null;

    public baseHSVShiftId: number = 0;
    public detailHSVShiftId: number = 0;

    static parse(data: string, type: string, def: any): any {
        if (!data) return def;

        switch (type) {
        case 'number':  return +data;
        case 'boolean': return data == '1';
        case 'array':
            let ret: number[] = [];
            for (let n of data.split('.'))
                if (!isNaN(+n))
                    ret.push(Math.floor(+n));
            return ret;
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
        this.groups   = GDObject.parse(data[57], 'array',   []);

        const baseShiftEnabled   = GDObject.parse(data[41], 'boolean', false);
        const detailShiftEnabled = GDObject.parse(data[42], 'boolean', false);

        if (baseShiftEnabled)
            this.baseHSVShift = HSVShift.parse(data[43]);
        if (detailShiftEnabled)
            this.detailHSVShift = HSVShift.parse(data[44]);

        const singleGroup = GDObject.parse(data[33], 'number', null);
        if (singleGroup)
            this.groups.push(singleGroup);

        let def: GDObjectInfo = Renderer.objectInfo.getData(this.id);

        if (def) {
            this.zorder = GDObject.parse(data[25], 'number', def.zorder);
            this.zlayer = GDObject.getZLayerValue(GDObject.parse(data[24], 'number', null)) ?? def.zlayer;
            
            this.baseCol   = GDObject.parse(data[21], 'number', def.baseCol);
            this.detailCol = GDObject.parse(data[22], 'number', def.detailCol);
        }
    }

    getColorChannel(spriteColor: ObjectSpriteColor): number {
        switch (spriteColor) {
        case ObjectSpriteColor.BASE:   return this.baseCol;
        case ObjectSpriteColor.DETAIL: return this.detailCol;
        case ObjectSpriteColor.BLACK:  return 1010;
        default:
            return 0;
        }
    }

    getModelMatrix(): Mat3 {
        let positionMatrix = new Mat3();
        let scaleMatrix = new Mat3();
        let rotationMatrix = new Mat3();

        let scale = new Vec2(this.scale, this.scale);

        if (this.xflip) scale.x *= -1;
        if (this.yflip) scale.y *= -1;

        positionMatrix.translate(new Vec2(this.x, this.y));
        scaleMatrix.scale(scale);
        rotationMatrix.rotate((-this.rotation) * Math.PI / 180);

        return positionMatrix.multiply(rotationMatrix).multiply(scaleMatrix);
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