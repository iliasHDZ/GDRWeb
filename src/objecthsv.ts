import { GDObject } from "./object/object";
import { HSVShift } from "./util/hsvshift";

interface GDLevel {
    getObjects(): GDObject[];
    timeAt(x: number): number;
    setProgress(step: number, percent: number): void;
}

export class ObjectHSVManager {
    objectHSVs: { [id: number]: HSVShift } = {};
    lastObjectHSVId = 1;

    level: GDLevel;

    constructor(level: GDLevel) {
        this.level = level;
    }

    reset() {
        this.objectHSVs = {};
    }

    getTotalHSVCount(): number {
        return this.lastObjectHSVId;
    }

    getIdOfHSV(hsv: HSVShift): number | null {
        for (let [k, v] of Object.entries(this.objectHSVs)) {
            if (hsv.equals(v))
                return +k;
        }

        return null;
    }

    getObjectHSV(id: number): HSVShift {
        return this.objectHSVs[id];
    }

    registerHSV(hsv: HSVShift): number {
        let id = this.getIdOfHSV(hsv);
        if (id != null)
            return id;

        id = this.lastObjectHSVId++;
        this.objectHSVs[id] = hsv;
        return id;
    }

    loadObjectHSVs() {
        const count = this.level.getObjects().length;
        let i = 0;

        for (let obj of this.level.getObjects()) {
            if (i % 1000 == 0)
                this.level.setProgress(7, i / count);
            i++;

            if (obj.baseHSVShift != null)
                obj.baseHSVShiftId = this.registerHSV(obj.baseHSVShift);
            
            if (obj.detailHSVShift != null)
                obj.detailHSVShiftId = this.registerHSV(obj.detailHSVShift);
        }
    }
}