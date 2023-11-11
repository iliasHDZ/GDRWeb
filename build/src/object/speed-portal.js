"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeedPortal = exports.PortalSpeed = void 0;
const object_1 = require("./object");
var PortalSpeed;
(function (PortalSpeed) {
    PortalSpeed[PortalSpeed["HALF"] = 0] = "HALF";
    PortalSpeed[PortalSpeed["ONE"] = 1] = "ONE";
    PortalSpeed[PortalSpeed["TWO"] = 2] = "TWO";
    PortalSpeed[PortalSpeed["THREE"] = 3] = "THREE";
    PortalSpeed[PortalSpeed["FOUR"] = 4] = "FOUR";
})(PortalSpeed = exports.PortalSpeed || (exports.PortalSpeed = {}));
class SpeedPortal extends object_1.GDObject {
    applyData(data) {
        super.applyData(data);
        let s;
        switch (this.id) {
            case 200:
                s = PortalSpeed.HALF;
                break;
            case 201:
                s = PortalSpeed.ONE;
                break;
            case 202:
                s = PortalSpeed.TWO;
                break;
            case 203:
                s = PortalSpeed.THREE;
                break;
            case 1334:
                s = PortalSpeed.FOUR;
                break;
        }
        this.speed = s;
    }
    static getSpeed(s) {
        switch (s) {
            case PortalSpeed.HALF: return 251.16;
            case PortalSpeed.ONE: return 311.58;
            case PortalSpeed.TWO: return 387.42;
            case PortalSpeed.THREE: return 468.00;
            case PortalSpeed.FOUR: return 576.00;
        }
    }
    static isOfType(id) {
        return id >= 200 && id <= 203 || id == 1334;
    }
}
exports.SpeedPortal = SpeedPortal;
