import { GDObject } from "./object";
export declare enum PortalSpeed {
    HALF = 0,
    ONE = 1,
    TWO = 2,
    THREE = 3,
    FOUR = 4
}
export declare class SpeedPortal extends GDObject {
    speed: PortalSpeed;
    applyData(data: {}): void;
    static getSpeed(s: PortalSpeed): number;
    static isOfType(id: number): boolean;
}
