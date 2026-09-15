import { ContextRenderOptions, RenderContext } from './context/glcontext';
import { Texture } from './render/texture';
import { Color } from './util/color';
import { Vec2 } from './util/vec2';
import { SpriteSheet } from './object/info/object-info';
import { ColorChannel, Level } from './level';
import { Camera } from './camera';
import { PlistAtlasLoader } from './object/plist-loader';
import { SpriteFrame } from './util/sprite';

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

const SPRITE_SHEET_NAMES: { [spriteSheet: number]: string } = {
    [+SpriteSheet.GAME_1]: "GJ_GameSheet",
    [+SpriteSheet.GAME_2]: "GJ_GameSheet02",
    [+SpriteSheet.FIRE]: "FireSheet_01",
    [+SpriteSheet.GLOW]: "GJ_GameSheetGlow",
    [+SpriteSheet.PIXEL]: "PixelSheet_01",
    [+SpriteSheet.PARTICLE]: "GJ_ParticleSheet",
};

export interface RenderOptions {
    hideTriggers: boolean;
};

export enum TextureQuality {
    LOW,
    MEDIUM,
    HIGH
};

const TEXTURE_QUALITY_SUFFIX: { [quality: number]: string } = {
    [+TextureQuality.LOW]: "",
    [+TextureQuality.MEDIUM]: "-hd",
    [+TextureQuality.HIGH]: "-uhd",
};

export class Renderer {
    ctx: RenderContext;

    spriteSheetTextures: { [spriteSheet: number]: Texture } = {};
    spriteFrames: { [key: string]: SpriteFrame } = {};

    textureQuality: TextureQuality;

    camera: Camera;

    handlers: { [_: string]: ((...a: any[]) => any)[] } = {};

    backgrounds: { [id: number]: Texture } = {};
    grounds: { [id: number]: [Texture | null, Texture | null] } = {};

    initialized: boolean = false;

    constructor(ctx: RenderContext, sheetPathPrefix: string, textureQuality: TextureQuality) {
        this.ctx = ctx;

        this.camera = new Camera(0, 0, 1.1);

        this.textureQuality = textureQuality;

        this.init(sheetPathPrefix);
    }

    private loadSpriteSheet(sheet: SpriteSheet, url: string): Promise<void> {
        return new Promise(async (resolve, _) => {
            const plist = await (new PlistAtlasLoader()).load(url + '.plist', 0);

            for (let [k, v] of Object.entries(plist))
                this.spriteFrames[k] = v;

            const texture = new Texture(this.ctx);
            texture.load(url + '.png');

            if (onload)
                texture.onload = () => {
                    console.log("loaded!");
                    resolve();
                };

            this.spriteSheetTextures[+sheet] = texture;
        });
    }

    async init(sheetPathPrefix: string) {
        for (const [sheet, name] of Object.entries(SPRITE_SHEET_NAMES))
            await this.loadSpriteSheet(+sheet, sheetPathPrefix + name + TEXTURE_QUALITY_SUFFIX[this.textureQuality]);

        this.initialized = true;
        this.emit('load');
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

    emit(event: string, ...args: any[]) {
        if (this.handlers[event])
            for (let h of this.handlers[event])
                h(...args);
    }

    on(event: string, handler: (...args: any[]) => any) {
        if (!this.handlers[event])
            this.handlers[event] = [];

        this.handlers[event].push(handler);
    }

    static getContentScaleFactor(): number {
        return 2;
    }

    static pixelsToPoints(p: Vec2): Vec2 {
        return new Vec2(p.x / this.getContentScaleFactor(), p.y / this.getContentScaleFactor());
    }

    static pointsToPixels(p: Vec2): Vec2 {
        return new Vec2(p.x * this.getContentScaleFactor(), p.y * this.getContentScaleFactor());
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
        if (!this.initialized)
            return;

        const playerX = this.camera.x;// - 75;
        const currentTime = level.timeAt(playerX);

        const rect = this.ctx.canvas.getBoundingClientRect();
        this.ctx.canvas.width = rect.width * window.devicePixelRatio;
        this.ctx.canvas.height = rect.height * window.devicePixelRatio;

        let [width, height] = [this.ctx.canvas.width, this.ctx.canvas.height];

        this.camera.setScreenSize(width, height);

        this.ctx.setSize(width, height);
        this.ctx.setViewMatrix(this.camera.getMatrix());

        const bg = this.backgrounds[level.backgroundId == 0 ? 1 : level.backgroundId];
        const [bgcolor, _] = level.colorAtTime(ColorChannel.BG, currentTime);
        if (bg && bg.loaded) {
            const bgsize = this.camera.getCameraWorldSize();
            this.ctx.renderTexture(this.camera.getPosition(), bgsize, bg.texture, bgcolor);
        } else {
            this.ctx.clearColor(bgcolor);
        }
        
        for (let c of level.validColorChannels)
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

        this.ctx.fillRect(new Vec2(0, 0), new Vec2(2, height), Color.fromRGBA(128, 255, 128, 80), false);

        if (this.ctx.prepareRender(ctxopts))
            gfx.render(level.colorManager.getBlendingStatesIdAtTime(currentTime));
        // this.renderGround(level, currentTime);
        this.ctx.renderGrid(new Vec2(this.camera.x, this.camera.y), this.camera.getCameraWorldSize(), 1 / this.camera.zoom);
    }
}