"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebGLContext = exports.GDRWebRenderer = void 0;
const renderer_1 = require("./renderer");
Object.defineProperty(exports, "GDRWebRenderer", { enumerable: true, get: function () { return renderer_1.GDRWebRenderer; } });
const glcontext_1 = require("./context/glcontext");
Object.defineProperty(exports, "WebGLContext", { enumerable: true, get: function () { return glcontext_1.WebGLContext; } });
