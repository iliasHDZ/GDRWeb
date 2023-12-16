import { PortalSpeed, SpeedPortal } from "./object/speed-portal";
import { SortedList } from "./util/sortedlist";

export class SpeedManager {
    startSpeed: PortalSpeed;
    speedPortals: SortedList<SpeedPortal>;

    constructor(startSpeed: PortalSpeed = PortalSpeed.ONE) {
        this.speedPortals = new SortedList<SpeedPortal>((a, b) => a.x - b.x);
        this.startSpeed = startSpeed;
    }

    timeAt(x: number): number {
        let sec = 0, lx = 15, spd = SpeedPortal.getSpeed(this.startSpeed);

        for (let sp of this.speedPortals.array) {
            if (sp.x >= x)
                break;

            let delta = sp.x - lx;
            if (delta < 0) continue;

            sec += delta / spd;
            lx  += delta;

            spd = SpeedPortal.getSpeed(sp.speed);
        }

        return sec + (x - lx) / spd;
    }

    posAt(s: number): number {
        let sec = 0, lx = 15, spd = SpeedPortal.getSpeed(this.startSpeed);

        for (let sp of this.speedPortals.array) {
            let delta = sp.x - lx;
            if (delta < 0) continue;

            let tsec = sec + delta / spd;

            if (tsec >= s)
                break;

            sec =  tsec;
            lx  += delta;

            spd = SpeedPortal.getSpeed(sp.speed);
        }

        return lx + (s - sec) * spd;
    }

    insertPortal(portal: SpeedPortal) {
        this.speedPortals.push(portal);
    }

    removePortal(portal: SpeedPortal) {
        this.speedPortals.remove(portal);
    }
};