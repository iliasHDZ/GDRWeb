import { ContextRenderOptions, RenderContext } from './context/context'
import { ObjectBatch } from './context/object-batch';
import { Texture } from './render/texture';
import { Color } from './util/color';
import { Mat3 } from './util/mat3';
import { Vec2 } from './util/vec2';
import { GDObjectInfo, GDObjectsInfo } from './object/info/object-info'

import objectDataList from '../assets/object_mod.json';
// import objectDataList from '../assets/data.json';
import { ColorChannel, Level } from './level';
import { Camera } from './camera';
import { PlistAtlasLoader } from './object/plist-loader';
import { SpriteCropInfo } from './util/sprite';
import { Profile } from './profiler';
import { GameObject } from './object/object';
import { TestBufferedObjectBatch } from './context/object-batch';
import { SpeedPortal } from './object/speed-portal';

const GD_BACKGROUND_COUNT = 20;
const GD_GROUND_COUNT = 17;

const groundNames: [string, string | null][] = [
    ["groundSquare_01_001-hd", null],
    ["groundSquare_02_001-hd", null],
    ["groundSquare_03_001-hd", null],
    ["groundSquare_04_001-hd", null],
    ["groundSquare_05_001-hd", null],
    ["groundSquare_06_001-hd", null],
    ["groundSquare_07_001-hd", null],
    ["groundSquare_08_001-hd", "groundSquare_08_2_001-hd"],
    ["groundSquare_09_001-hd", "groundSquare_09_2_001-hd"],
    ["groundSquare_10_001-hd", "groundSquare_10_2_001-hd"],
    ["groundSquare_11_001-hd", "groundSquare_11_2_001-hd"],
    ["groundSquare_12_001-hd", "groundSquare_12_2_001-hd"],
    ["groundSquare_13_001-hd", "groundSquare_13_2_001-hd"],
    ["groundSquare_14_001-hd", "groundSquare_14_2_001-hd"],
    ["groundSquare_15_001-hd", "groundSquare_15_2_001-hd"],
    ["groundSquare_16_001-hd", "groundSquare_16_2_001-hd"],
    ["groundSquare_17_001-hd", "groundSquare_17_2_001-hd"],
];

export interface RenderOptions {
    hideTriggers: boolean;
};

export class Renderer {
    ctx: RenderContext;

    sheet0: Texture;
    sheet2: Texture;

    camera: Camera;

    static objectInfo: GDObjectsInfo = null;

    handlers: {} = {};

    backgrounds: { [id: number]: Texture } = {};
    grounds: { [id: number]: [Texture | null, Texture | null] } = {};

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

    public async loadBackgrounds(bgPathFunc: (bgname: string) => string | null) {
        for (let i = 1; i <= GD_BACKGROUND_COUNT; i++) {
            const path = bgPathFunc(`game_bg_${i < 10 ? '0' + i : i}_001-hd`);
            if (path == null)
                continue;

            const bg = new Texture(this.ctx);
            bg.load(path);

            this.backgrounds[i] = bg;
        }
    }

    public async loadGrounds(gndPathFunc: (bgname: string) => string | null) {
        for (let i = 1; i <= GD_GROUND_COUNT; i++) {
            const gndNames = groundNames[i - 1];
            let gndTexs: [Texture | null, Texture | null] = [null, null];

            if (gndNames[0] != null) {
                const path = gndPathFunc(gndNames[0]);
                if (path != null) {
                    const gnd = new Texture(this.ctx);
                    gnd.load(path);
                    gndTexs[0] = gnd;
                }
            }

            if (gndNames[1] != null) {
                const path = gndPathFunc(gndNames[1]);
                if (path != null) {
                    const gnd = new Texture(this.ctx);
                    gnd.load(path);
                    gndTexs[1] = gnd;
                }
            }

            this.grounds[i] = gndTexs;
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

    createObjectBatch(level: Level): ObjectBatch {
        const batch = this.ctx.createObjectBatch(level);
        batch.setRenderInfo(Renderer.objectInfo);
        return batch;
    }

    renderGroundTexture(texture: Texture, color: Color, gndNum: number) {
        let y: number;
        if (gndNum == 0) {
            y = texture.height / 2 - 256;
        } else {
            y = -(texture.height / 2);
        }

        const width = texture.width;
        const camSize = this.camera.getCameraWorldSize();
        
        let begin = this.camera.x - camSize.x / 2;
        let end   = this.camera.x + camSize.x / 2;

        begin = Math.floor(begin / width);
        end   = Math.ceil(end    / width);

        for (let i = begin; i < end; i++) {
            this.ctx.renderTexture(new Vec2(i * width + width / 2, y), new Vec2(texture.width, texture.height), texture.texture, color);
        }
    }

    renderGround(level: Level, currentTime: number) {
        const [gnd1Color] = level.colorAtTime(ColorChannel.G1, currentTime);
        const [gnd2Color] = level.colorAtTime(ColorChannel.G2, currentTime);
        const [lineColor]   = level.colorAtTime(ColorChannel.LINE, currentTime);

        const camSize = this.camera.getCameraWorldSize();

        const gndTexs = this.grounds[level.groundId == 0 ? 1 : level.groundId];
        if (gndTexs) {
            if (gndTexs[0] != null)
                this.renderGroundTexture(gndTexs[0], gnd1Color, 0);
            if (gndTexs[1] != null)
                this.renderGroundTexture(gndTexs[1], gnd2Color, 1);
        } else {
            this.ctx.fillRect(new Vec2(this.camera.x, -64), new Vec2(camSize.x, 128), gnd1Color);
        }

        this.ctx.fillRect(new Vec2(this.camera.x, -1), new Vec2(camSize.x, 2), lineColor);
    }

    render(level: Level, options: RenderOptions = { hideTriggers: false }) {
        const playerX = this.camera.x;// - 75;
        const currentTime = level.timeAt(playerX);

        this.camera.setScreenSize(this.ctx.canvas.width, this.ctx.canvas.height);

        this.ctx.setSize(this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.setViewMatrix(this.camera.getMatrix());

        const bg = this.backgrounds[level.backgroundId == 0 ? 1 : level.backgroundId];
        const [bgcolor, _] = level.colorAtTime(1000, currentTime);
        if (bg && bg.loaded) {
            const bgsize = this.camera.getCameraWorldSize();
            this.ctx.renderTexture(this.camera.getPosition(), bgsize, bg.texture, bgcolor);
        } else {
            this.ctx.clearColor(bgcolor);
        }
        
        for (let c of level.valid_channels)
            this.ctx.setColorChannel(c, ...level.colorAtTime(c, currentTime));

        for (let i = 1; i < level.groupManager.getTotalGroupCount(); i++)
            this.ctx.setGroupState(i, level.groupManager.getGroupStateAt(i, currentTime));

        for (let i = 0; i < level.transformManager.getTotalTransformCount(); i++)
            this.ctx.setGroupTransform(i, level.transformManager.valueAt(i, currentTime));

        if (!level.objectHSVsLoaded) {
            for (let i = 1; i < level.objectHSVManager.getTotalHSVCount(); i++)
                this.ctx.setObjectHSV(i, level.objectHSVManager.getObjectHSV(i));

            level.objectHSVsLoaded = true;
        }

        let ctxopts = new ContextRenderOptions();

        ctxopts.hideTriggers = options.hideTriggers;

        const gfx = level.fetchLevelGraphics(this);

        this.ctx.render(gfx.mainBatch, ctxopts, this.sheet0, this.sheet2);
        this.renderGround(level, currentTime);
    }

    testBatchInsertion(): boolean {
        const level = new Level();
        level.init();

        const objects1 = GameObject.generateRandomObjects(10);
        const objects2 = GameObject.generateRandomObjects(10);

        const batch1 = new TestBufferedObjectBatch(level);
        const batch2 = new TestBufferedObjectBatch(level);

        batch1.setRenderInfo(Renderer.objectInfo);
        batch2.setRenderInfo(Renderer.objectInfo);

        console.log("PREPARING BATCH A");
        batch1.insertMultiple(objects1.concat(objects2));

        console.log("PREPARING BATCH B");
        batch2.insertMultiple(objects1);
        batch2.insertMultiple(objects2);

        console.log(objects1);
        console.log(objects2);
        console.log(batch1);
        console.log(batch2);

        batch1.printLayering();
        batch2.printLayering();

        const success = TestBufferedObjectBatch.haveSameResults(batch1, batch2);
        console.log(success);

        return success;
    }

    testBatchRemoval(): boolean {
        const level = new Level();
        level.init();

        const objects1 = GameObject.generateRandomObjects(10);
        const objects2 = GameObject.generateRandomObjects(10);

        const batch1 = new TestBufferedObjectBatch(level);
        const batch2 = new TestBufferedObjectBatch(level);

        batch1.setRenderInfo(Renderer.objectInfo);
        batch2.setRenderInfo(Renderer.objectInfo);

        console.log("PREPARING BATCH A");
        batch1.insertMultiple(objects1);

        console.log("PREPARING BATCH B");
        batch2.insertMultiple(objects1.concat(objects2));
        batch2.removeMultiple(objects2);

        console.log(objects1);
        console.log(objects2);
        console.log(batch1);
        console.log(batch2);

        batch1.printLayering();
        batch2.printLayering();

        const success = TestBufferedObjectBatch.haveSameResults(batch1, batch2);
        console.log(success);

        return success;
    }

    testSpeedPortalInsertion(): Level | null {
        const level1 = new Level();
        level1.init();

        const level2 = new Level();
        level2.init();

        const portals1 = SpeedPortal.generateRandomObjects(20, {randTransform: true});
        const portals2 = SpeedPortal.generateRandomObjects(20, {randTransform: true});

        console.log(portals1);
        console.log(portals2);

        level1.insertObjects(portals1.concat(portals2));

        level2.insertObjects(portals1);
        level2.insertObjects(portals2);

        const time1 = level1.timeAt(3000);
        const time2 = level2.timeAt(3000);

        console.log(time1, time2);

        if (Math.abs(time1 - time2) > 0.01)
            return null;

        const pos1 = level1.posAt(time1);
        const pos2 = level2.posAt(time2);

        console.log(pos1, pos2);

        if (Math.abs(pos1 - 3000) > 0.01)
            return null;
        if (Math.abs(pos2 - 3000) > 0.01)
            return null;

        return level1;
    }
}