"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GDObject = void 0;
const renderer_1 = require("../renderer");
const object_info_1 = require("./info/object-info");
const object_sprite_1 = require("./info/object-sprite");
const mat3_1 = require("../util/mat3");
const __1 = require("..");
const hsvshift_1 = require("../util/hsvshift");
class GDObject {
    constructor() {
        this.baseHSVShift = null;
        this.detailHSVShift = null;
        this.baseHSVShiftId = 0;
        this.detailHSVShiftId = 0;
    }
    static parse(data, type, def) {
        if (!data)
            return def;
        switch (type) {
            case 'number': return +data;
            case 'boolean': return data == '1';
            case 'array':
                let ret = [];
                for (let n of data.split('.'))
                    if (!isNaN(+n))
                        ret.push(Math.floor(+n));
                return ret;
            default: return def;
        }
    }
    static getZLayerValue(z) {
        switch (z) {
            case -3: return object_info_1.ZLayer.B4;
            case -1: return object_info_1.ZLayer.B3;
            case 1: return object_info_1.ZLayer.B2;
            case 3: return object_info_1.ZLayer.B1;
            case 5: return object_info_1.ZLayer.T1;
            case 7: return object_info_1.ZLayer.T2;
            case 9: return object_info_1.ZLayer.T3;
            default: return null;
        }
    }
    applyData(data) {
        this.id = GDObject.parse(data[1], 'number', 1);
        this.x = GDObject.parse(data[2], 'number', 0);
        this.y = GDObject.parse(data[3], 'number', 0);
        this.xflip = GDObject.parse(data[4], 'boolean', false);
        this.yflip = GDObject.parse(data[5], 'boolean', false);
        this.rotation = GDObject.parse(data[6], 'number', 0);
        this.scale = GDObject.parse(data[32], 'number', 1);
        this.groups = GDObject.parse(data[57], 'array', []);
        const baseShiftEnabled = GDObject.parse(data[41], 'boolean', false);
        const detailShiftEnabled = GDObject.parse(data[42], 'boolean', false);
        if (baseShiftEnabled)
            this.baseHSVShift = hsvshift_1.HSVShift.parse(data[43]);
        if (detailShiftEnabled)
            this.detailHSVShift = hsvshift_1.HSVShift.parse(data[44]);
        const singleGroup = GDObject.parse(data[33], 'number', null);
        if (singleGroup)
            this.groups.push(singleGroup);
        let def = renderer_1.Renderer.objectInfo.getData(this.id);
        if (def) {
            this.zorder = GDObject.parse(data[25], 'number', def.zorder);
            this.zlayer = GDObject.getZLayerValue(GDObject.parse(data[24], 'number', null)) ?? def.zlayer;
            this.baseCol = GDObject.parse(data[21], 'number', def.baseCol);
            this.detailCol = GDObject.parse(data[22], 'number', def.detailCol);
        }
    }
    getColorChannel(spriteColor) {
        switch (spriteColor) {
            case object_sprite_1.ObjectSpriteColor.BASE: return this.baseCol;
            case object_sprite_1.ObjectSpriteColor.DETAIL: return this.detailCol;
            case object_sprite_1.ObjectSpriteColor.BLACK: return 1010;
            default:
                return 0;
        }
    }
    getModelMatrix() {
        let positionMatrix = new mat3_1.Mat3();
        let scaleMatrix = new mat3_1.Mat3();
        let rotationMatrix = new mat3_1.Mat3();
        let scale = new __1.Vec2(this.scale, this.scale);
        if (this.xflip)
            scale.x *= -1;
        if (this.yflip)
            scale.y *= -1;
        positionMatrix.translate(new __1.Vec2(this.x, this.y));
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
    static compareZOrder(o1, o2) {
        if (o1.zlayer != o2.zlayer)
            return o1.zlayer - o2.zlayer;
        return o1.zorder - o2.zorder;
    }
}
exports.GDObject = GDObject;
