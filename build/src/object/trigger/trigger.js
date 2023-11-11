"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trigger = void 0;
const object_1 = require("../object");
class Trigger extends object_1.GDObject {
    applyData(data) {
        super.applyData(data);
        this.spawnTriggered = object_1.GDObject.parse(data[62], 'boolean', false);
        this.touchTriggered = object_1.GDObject.parse(data[11], 'boolean', false);
    }
}
exports.Trigger = Trigger;
