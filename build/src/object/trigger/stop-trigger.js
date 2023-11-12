"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StopTrigger = void 0;
const object_1 = require("../object");
const trigger_1 = require("./trigger");
class StopTrigger extends trigger_1.Trigger {
    applyData(data) {
        super.applyData(data);
        console.log(data);
        this.targetGroupId = object_1.GDObject.parse(data[51], 'number', 0);
    }
    static isOfType(id) {
        return id == 1616;
    }
}
exports.StopTrigger = StopTrigger;
