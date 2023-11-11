"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Camera = void 0;
const mat3_1 = require("./util/mat3");
const vec2_1 = require("./util/vec2");
class Camera {
    constructor(x, y, zoom) {
        this.x = x;
        this.y = y;
        this.zoom = zoom;
    }
    setScreenSize(width, height) {
        this.screenSize = new vec2_1.Vec2(width, height);
    }
    screenToWorldPos(pos) {
        const x = (pos.x - (this.screenSize.x / 2)) / this.zoom + this.x;
        const y = ((this.screenSize.y / 2) - pos.y) / this.zoom + this.y;
        return new vec2_1.Vec2(x, y);
    }
    getCameraWorldSize() {
        return this.screenSize.div(new vec2_1.Vec2(this.zoom, this.zoom));
    }
    getMatrix() {
        let m = new mat3_1.Mat3();
        const width = this.screenSize.x;
        const height = this.screenSize.y;
        m.scale(new vec2_1.Vec2(2 / width * this.zoom, 2 / height * this.zoom));
        m.translate(new vec2_1.Vec2(-this.x, -this.y));
        return m;
    }
}
exports.Camera = Camera;
