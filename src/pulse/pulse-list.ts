import { Color } from "../util/color";
import { HSVShift } from "../util/hsvshift";
import { PulseColorEntry, PulseEntry, PulseHSVEntry } from "./pulse-entry";

export class PulseList {
    entries: PulseEntry[];

    constructor() {
        this.entries = [];
    }

    public add(entry: PulseEntry) {
        this.entries.push(entry);
    }

    public addList(list: PulseList) {
        for (let entry of list.entries)
            this.add(entry);
    }

    public addColorPulse(color: Color, intensity: number, baseOnly: boolean, detailOnly: boolean) {
        this.add(new PulseColorEntry(color, intensity, baseOnly, detailOnly));
    }

    public addHSVPulse(hsv: HSVShift, intensity: number, baseOnly: boolean, detailOnly: boolean) {
        this.add(new PulseHSVEntry(hsv, intensity, baseOnly, detailOnly));
    }

    public applyToColor(color: Color): Color {
        for (let entry of this.entries) {
            color = entry.applyToColor(color);
        }

        return color;
    }
}