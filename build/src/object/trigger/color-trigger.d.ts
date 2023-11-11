import { GDColor } from "../../util/gdcolor";
import { HSVShift } from "../../util/hsvshift";
import { TriggerValue, ValueTrigger } from "./value-trigger";
export declare class ColorTriggerValue extends TriggerValue {
    color: GDColor;
    constructor(color: GDColor);
    static default(): ColorTriggerValue;
}
export declare class ColorTrigger extends ValueTrigger {
    r: number;
    g: number;
    b: number;
    opacity: number;
    blending: boolean;
    plrcol1: boolean;
    plrcol2: boolean;
    copyId: number;
    copyOpacity: boolean;
    copyHsvShift: HSVShift;
    color: number;
    duration: number;
    applyData(data: {}): void;
    getColor(): GDColor;
    valueAfterDelta(startValue: TriggerValue, deltaTime: number): TriggerValue;
    getDuration(): number;
    static isOfType(id: number): boolean;
}
