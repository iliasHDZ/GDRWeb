import { Mat3 } from "./util/mat3";
import { Vec2 } from "./util/vec2";
export declare class Camera {
    x: number;
    y: number;
    zoom: number;
    screenSize: Vec2;
    constructor(x: number, y: number, zoom: number);
    setScreenSize(width: number, height: number): void;
    screenToWorldPos(pos: Vec2): Vec2;
    getCameraWorldSize(): Vec2;
    getMatrix(): Mat3;
}
