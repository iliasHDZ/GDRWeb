"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectHSVManager = void 0;
class ObjectHSVManager {
    constructor(level) {
        this.objectHSVs = {};
        this.lastObjectHSVId = 1;
        this.level = level;
    }
    reset() {
        this.objectHSVs = {};
    }
    getTotalHSVCount() {
        return this.lastObjectHSVId;
    }
    getIdOfHSV(hsv) {
        for (let [k, v] of Object.entries(this.objectHSVs)) {
            if (hsv.equals(v))
                return +k;
        }
        return null;
    }
    getObjectHSV(id) {
        return this.objectHSVs[id];
    }
    registerHSV(hsv) {
        let id = this.getIdOfHSV(hsv);
        if (id != null)
            return id;
        id = this.lastObjectHSVId++;
        this.objectHSVs[id] = hsv;
        return id;
    }
    loadObjectHSVs() {
        for (let obj of this.level.getObjects()) {
            if (obj.baseHSVShift != null)
                obj.baseHSVShiftId = this.registerHSV(obj.baseHSVShift);
            if (obj.detailHSVShift != null)
                obj.detailHSVShiftId = this.registerHSV(obj.detailHSVShift);
        }
    }
}
exports.ObjectHSVManager = ObjectHSVManager;
