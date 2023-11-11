import { GDObject } from "../object";

export abstract class Trigger extends GDObject {
    spawnTriggered: boolean;
    touchTriggered: boolean;

    applyData(data: {}) {
        super.applyData(data);

        this.spawnTriggered = GDObject.parse(data[62], 'boolean', false);
        this.touchTriggered = GDObject.parse(data[11], 'boolean', false);
    }
}