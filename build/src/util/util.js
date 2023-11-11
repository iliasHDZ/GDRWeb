"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Util = void 0;
var Util;
(function (Util) {
    function lerp(v1, v2, a) {
        return (1 - a) * v1 + a * v2;
    }
    Util.lerp = lerp;
    function clamp(val, min, max) {
        return Math.min(max, Math.max(min, val));
    }
    Util.clamp = clamp;
})(Util = exports.Util || (exports.Util = {}));
