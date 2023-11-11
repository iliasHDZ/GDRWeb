"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Renderer = void 0;
const texture_1 = require("./render/texture");
const vec2_1 = require("./util/vec2");
const object_info_1 = require("./object/info/object-info");
const object_mod_json_1 = __importDefault(require("../assets/object_mod.json"));
const camera_1 = require("./camera");
const plist_loader_1 = require("./object/plist-loader");
class Renderer {
    constructor(ctx, sheetpath0, sheetpath2) {
        this.handlers = {};
        this.ctx = ctx;
        this.camera = new camera_1.Camera(0, 0, 1);
        this.init(sheetpath0, sheetpath2);
    }
    static async initTextureInfo(plistpath0, plistpath2) {
        if (this.objectInfo != null)
            return;
        const plist0 = await (new plist_loader_1.PlistAtlasLoader()).load(plistpath0, 0);
        const plist2 = await (new plist_loader_1.PlistAtlasLoader()).load(plistpath2, 2);
        let atlas = {};
        for (let [k, v] of Object.entries(plist0))
            atlas[k] = v;
        for (let [k, v] of Object.entries(plist2))
            atlas[k] = v;
        const data = object_info_1.GDObjectInfo.fromJSONList(object_mod_json_1.default, atlas);
        Renderer.objectInfo = new object_info_1.GDObjectsInfo(atlas, data);
    }
    async init(sheetpath0, sheetpath2) {
        this.sheet0 = new texture_1.Texture(this.ctx);
        this.sheet0.load(sheetpath0);
        this.sheet2 = new texture_1.Texture(this.ctx);
        this.sheet2.load(sheetpath2);
        let r = this;
        let loadCount = 0;
        this.sheet2.onload = this.sheet0.onload = () => {
            loadCount++;
            if (loadCount >= 2)
                r.emit('load');
        };
    }
    emit(event, ...args) {
        if (this.handlers[event])
            for (let h of this.handlers[event])
                h(...args);
    }
    on(event, handler) {
        if (!this.handlers[event])
            this.handlers[event] = [];
        this.handlers[event].push(handler);
    }
    render(level) {
        level.profiler.start("Rendering");
        const playerX = this.camera.x; // - 75;
        const currentTime = level.timeAt(playerX);
        this.camera.setScreenSize(this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.setSize(this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.setViewMatrix(this.camera.getMatrix());
        level.profiler.start("Color Channel Evaluation", true);
        const [bg, _] = level.colorAtTime(1000, currentTime);
        this.ctx.clearColor(bg);
        for (let c of level.valid_channels) {
            level.profiler.start("Channel " + c);
            this.ctx.setColorChannel(c, ...level.colorAtTime(c, currentTime));
            level.profiler.end();
        }
        level.profiler.end();
        level.profiler.start("Group State Evaluation");
        for (let i = 1; i < level.groupManager.getTotalGroupCount(); i++)
            this.ctx.setGroupState(i, level.groupManager.getGroupStateAt(i, currentTime));
        level.profiler.end();
        if (!level.objectHSVsLoaded) {
            for (let i = 1; i < level.objectHSVManager.getTotalHSVCount(); i++)
                this.ctx.setObjectHSV(i, level.objectHSVManager.getObjectHSV(i));
            level.objectHSVsLoaded = true;
        }
        const [groundColor] = level.colorAtTime(1001, currentTime);
        const [lineColor] = level.colorAtTime(1002, currentTime);
        const camSize = this.camera.getCameraWorldSize();
        level.profiler.start("Render Call");
        this.ctx.render(level.level_col);
        this.ctx.fillRect(new vec2_1.Vec2(this.camera.x, -64), new vec2_1.Vec2(camSize.x, 128), groundColor);
        this.ctx.fillRect(new vec2_1.Vec2(this.camera.x, -1), new vec2_1.Vec2(camSize.x, 2), lineColor);
        level.profiler.end();
        return level.profiler.end();
    }
}
exports.Renderer = Renderer;
Renderer.objectInfo = null;
