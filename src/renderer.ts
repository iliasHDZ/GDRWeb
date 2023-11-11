import { RenderContext } from './context/context'
import { ObjectBatch } from './render/object-batch';
import { Texture } from './render/texture';
import { Color } from './util/color';
import { Mat3 } from './util/mat3';
import { Vec2 } from './util/vec2';
import { GDObjectInfo, GDObjectsInfo } from './object/info/object-info'

import objectDataList from '../assets/object_mod.json';
// import objectDataList from '../assets/data.json';
import { GDLevel } from './level';
import { Camera } from './camera';
import { PlistAtlasLoader } from './object/plist-loader';
import { SpriteCropInfo } from './util/sprite';
import { Profile } from './profiler';

export class Renderer {
    ctx: RenderContext;

    sheet0: Texture;
    sheet2: Texture;

    camera: Camera;

    static objectInfo: GDObjectsInfo = null;

    handlers: {} = {};

    constructor(ctx: RenderContext, sheetpath0: string, sheetpath2: string) {
        this.ctx = ctx;

        this.camera = new Camera(0, 0, 1);

        this.init(sheetpath0, sheetpath2);
    }

    public static async initTextureInfo(plistpath0: string, plistpath2: string) {
        if (this.objectInfo != null)
            return;

        const plist0 = await (new PlistAtlasLoader()).load(plistpath0, 0);
        const plist2 = await (new PlistAtlasLoader()).load(plistpath2, 2);
        
        let atlas: {[key: string]: SpriteCropInfo} = {};

        for (let [k, v] of Object.entries(plist0))
            atlas[k] = v;

        for (let [k, v] of Object.entries(plist2))
            atlas[k] = v;

        const data = GDObjectInfo.fromJSONList(objectDataList, atlas);

        Renderer.objectInfo = new GDObjectsInfo(atlas, data);
    }

    async init(sheetpath0: string, sheetpath2: string) {
        this.sheet0 = new Texture(this.ctx);
        this.sheet0.load(sheetpath0);
        this.sheet2 = new Texture(this.ctx);
        this.sheet2.load(sheetpath2);

        let r = this;

        let loadCount = 0;

        this.sheet2.onload = this.sheet0.onload = () => {
            loadCount++;
            if (loadCount >= 2)
                r.emit('load');
        }
    }

    emit(event: string, ...args) {
        if (this.handlers[event])
            for (let h of this.handlers[event])
                h(...args);
    }

    on(event: string, handler: Function) {
        if (!this.handlers[event])
            this.handlers[event] = [];

        this.handlers[event].push(handler);
    }

    render(level: GDLevel): Profile {
        level.profiler.start("Rendering");

        const playerX = this.camera.x;// - 75;
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
        const [lineColor]   = level.colorAtTime(1002, currentTime);

        const camSize = this.camera.getCameraWorldSize();

        level.profiler.start("Render Call");
        this.ctx.render(level.level_col);

        this.ctx.fillRect(new Vec2(this.camera.x, -64), new Vec2(camSize.x, 128), groundColor);
        this.ctx.fillRect(new Vec2(this.camera.x, -1), new Vec2(camSize.x, 2), lineColor);
        level.profiler.end();

        return level.profiler.end();
    }
}