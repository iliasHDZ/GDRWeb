import { ZLayer } from "./info/object-info";
import { ObjectSpriteColor } from "./info/object-sprite";
import { Mat3 } from "../util/mat3";
import { HSVShift } from "../util/hsvshift";
export declare class GDObject {
    id: number;
    x: number;
    y: number;
    xflip: boolean;
    yflip: boolean;
    rotation: number;
    scale: number;
    zorder: number;
    zlayer: ZLayer;
    groups: number[];
    groupComb: number;
    baseCol: number;
    detailCol: number;
    baseHSVShift: HSVShift | null;
    detailHSVShift: HSVShift | null;
    baseHSVShiftId: number;
    detailHSVShiftId: number;
    static parse(data: string, type: string, def: any): any;
    static getZLayerValue(z: number): ZLayer;
    applyData(data: {}): void;
    getColorChannel(spriteColor: ObjectSpriteColor): number;
    getModelMatrix(): Mat3;
    static compareZOrder(o1: GDObject, o2: GDObject): number;
}
