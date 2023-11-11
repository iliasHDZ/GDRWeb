import { GDObject } from "./object/object";
import { HSVShift } from "./util/hsvshift";
interface GDLevel {
    getObjects(): GDObject[];
    timeAt(x: number): number;
}
export declare class ObjectHSVManager {
    objectHSVs: {
        [id: number]: HSVShift;
    };
    lastObjectHSVId: number;
    level: GDLevel;
    constructor(level: GDLevel);
    reset(): void;
    getTotalHSVCount(): number;
    getIdOfHSV(hsv: HSVShift): number | null;
    getObjectHSV(id: number): HSVShift;
    registerHSV(hsv: HSVShift): number;
    loadObjectHSVs(): void;
}
export {};
