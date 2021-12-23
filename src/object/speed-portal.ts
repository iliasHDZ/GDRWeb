import { GDObject } from "./object";

export enum PortalSpeed {
    HALF,
    ONE,
    TWO,
    THREE,
    FOUR
}

export class SpeedPortal extends GDObject {
    speed: PortalSpeed;

    applyData(data: {}) {
        super.applyData(data);

        let s: PortalSpeed;

        switch (this.id) {
            case 200:  s = PortalSpeed.HALF; break;
            case 201:  s = PortalSpeed.ONE; break;
            case 202:  s = PortalSpeed.TWO; break;
            case 203:  s = PortalSpeed.THREE; break;
            case 1334: s = PortalSpeed.FOUR; break;
        }

        this.speed = s;
    }

    static getSpeed(s: PortalSpeed): number {
        switch (s) {
            case PortalSpeed.HALF:  return 251.16;
            case PortalSpeed.ONE:   return 311.58;
            case PortalSpeed.TWO:   return 387.42;
            case PortalSpeed.THREE: return 468.00;
            case PortalSpeed.FOUR:  return 576.00;
        }
    }

    static isOfType(id: number): boolean {
        return id >= 200 && id <= 203 || id == 1334;
    }
}