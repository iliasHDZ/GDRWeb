import { BaseColor } from "../../util/basecolor";
import { Color } from "../../util/color";
import { GDColor } from "../../util/gdcolor";
import { MixedColor } from "../../util/mixedcolor";
import { PlayerColor } from "../../util/playercolor";
import { GDObject } from "../object";
import { TriggerValue, ValueTrigger } from "./value-trigger";

export class ColorTriggerValue extends TriggerValue {
    public color: GDColor;

    constructor(color: GDColor) {
        super();
        this.color = color;
    }
};

export class ColorTrigger extends ValueTrigger {
    r: number;
    g: number;
    b: number;

    opacity: number;
    blending: boolean;

    plrcol1: boolean;
    plrcol2: boolean;

    color: number;

    applyData(data: {}) {
        super.applyData(data);

        this.r = GDObject.parse(data[7], 'number', 255);
        this.g = GDObject.parse(data[8], 'number', 255);
        this.b = GDObject.parse(data[9], 'number', 255);

        this.duration = GDObject.parse(data[10], 'number', 0);

        this.blending = GDObject.parse(data[17], 'boolean', false);
        this.opacity  = GDObject.parse(data[35], 'number', 1);

        this.plrcol1 = GDObject.parse(data[15], 'boolean', false);
        this.plrcol2 = GDObject.parse(data[16], 'boolean', false);

        if (data[23])
            this.color = +data[23];
        else {
            let color = 1;

            switch (this.id) {
                case 29:  color = 1000; break;
                case 30:  color = 1001; break;
                case 104: color = 1002; break;
                case 105: color = 1004; break;
                case 221: color = 1; break;
                case 717: color = 2; break;
                case 718: color = 3; break;
                case 743: color = 4; break;
                case 744: color = 1003; break;
            }

            this.color = color;
        }
    }

    getColor(): GDColor {
        if (this.plrcol1 || this.plrcol2)
            return new PlayerColor(this.plrcol1 ? 0 : 1, this.opacity, this.blending);

        return new BaseColor(this.r, this.g, this.b, this.opacity, this.blending);
    }

    public valueAfterDelta(startValue: TriggerValue, deltaTime: number): TriggerValue {
        let startCol: GDColor = new BaseColor(255, 255, 255, 1, false);
        if (startValue instanceof ColorTriggerValue)
            startCol = startValue.color;

        const endCol = this.getColor();

        if (deltaTime >= this.duration)
            return new ColorTriggerValue(endCol);

        return new ColorTriggerValue(MixedColor.mix(startCol, endCol, deltaTime / this.duration));
    }

    static isOfType(id: number): boolean {
        return id == 29 ||
               id == 30 ||
               id == 104 ||
               id == 105 ||
               id == 221 ||
               id == 717 ||
               id == 718 ||
               id == 743 ||
               id == 744 ||
               id == 899 ||
               id == 900 ||
               id == 915;
    }
}