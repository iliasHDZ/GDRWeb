import { GDObject } from "../object";
export declare abstract class Trigger extends GDObject {
    spawnTriggered: boolean;
    touchTriggered: boolean;
    applyData(data: {}): void;
}
