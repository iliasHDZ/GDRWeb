import { Level } from "../level";
import { GameObject, ObjectPropertyReader, RandomProps } from "./object";

export enum PortalSpeed {
    HALF,
    ONE,
    TWO,
    THREE,
    FOUR
}

export class SpeedPortal extends GameObject {
    speed: PortalSpeed = PortalSpeed.ONE;

    onInsert(level: Level): void {
        level.speedManager.insertPortal(this);
    }

    onRemove(level: Level): void {
        level.speedManager.removePortal(this);
    }

    applyProperties(rd: ObjectPropertyReader) {
        super.applyProperties(rd);

        let speed: PortalSpeed;

        switch (this.id) {
        case 200:  speed = PortalSpeed.HALF; break;
        default:
        case 201:  speed = PortalSpeed.ONE; break;
        case 202:  speed = PortalSpeed.TWO; break;
        case 203:  speed = PortalSpeed.THREE; break;
        case 1334: speed = PortalSpeed.FOUR; break;
        }

        this.speed = speed;
    }

    static getSpeed(speed: PortalSpeed): number {
        switch (speed) {
        case PortalSpeed.HALF:  return 251.16;
        case PortalSpeed.ONE:   return 311.58;
        case PortalSpeed.TWO:   return 387.42;
        case PortalSpeed.THREE: return 468.00;
        case PortalSpeed.FOUR:  return 576.00;
        }
    }

    static generateRandomObject(props: RandomProps = {}): SpeedPortal {
        props.ids = [200, 201, 202, 203, 1334];
        return GameObject.generateRandomObject(props) as SpeedPortal;
    }

    static generateRandomObjects(count: number, props: RandomProps = {}): SpeedPortal[] {
        const objs: SpeedPortal[] = [];
        for (let i = 0; i < count; i++)
            objs.push(this.generateRandomObject(props));
        return objs;
    }

    static isOfType(id: number): boolean {
        return (id >= 200 && id <= 203) || id == 1334;
    }
}