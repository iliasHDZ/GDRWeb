"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerColor = void 0;
const gdcolor_1 = require("./gdcolor");
class PlayerColor extends gdcolor_1.GDColor {
    constructor(plrcol, opacity, blending) {
        super();
        this.plrcol = plrcol;
        this.opacity = opacity;
        this.blending = blending;
    }
    evaluate(level, time) {
        return [level.getPlayerColor(this.plrcol, this.opacity), this.blending];
    }
}
exports.PlayerColor = PlayerColor;
