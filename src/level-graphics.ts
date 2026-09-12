import { Level, Renderer } from ".";
import { SpriteBatch } from "./context/sprite-batch";
import { ObjectInfo, ObjectSprite, SpriteColorType, SpriteSheet, ZLayer } from "./object/info/object-info";
import { GameObject } from "./object/object";

const SPRITE_SHEET_DRAW_ORDER = [
    SpriteSheet.GLOW,
    SpriteSheet.PARTICLE,
    SpriteSheet.PIXEL,
    SpriteSheet.GAME_2,
    SpriteSheet.FIRE,
    SpriteSheet.TEXT,
    SpriteSheet.SPECIAL,
    SpriteSheet._UNK,
    SpriteSheet.GAME_1
];

export class LevelGraphics {
    public level: Level;
    public renderer: Renderer;

    private spriteBatches: { [zlayer: number]: { [spritesheet: number]: SpriteBatch } } = {};

    private spriteBatch: SpriteBatch | null = null;

    constructor(level: Level, renderer: Renderer) {
        this.level = level;
        this.renderer = renderer;
    }

    initWithObjects(objects: GameObject[]) {
        const gl = this.renderer.ctx.gl;
        if (!gl)
            throw new Error("no webgl context");

        const objectsSortedByZOrder = objects.slice();
        objectsSortedByZOrder.sort((a, b) => a.zorder - b.zorder);

        /*
        const sprites: { [zlayer: number]: { [spritesheet: number]: [GameObject, ObjectSprite][] } } = {};

        for (const object of objectsSortedByZOrder) {
            const objectInfo = GameObject.getObjectInfo(object.id);
            if (!objectInfo)
                continue;

            for (const sprite of objectInfo.sprites) {
                let spriteSheet = objectInfo.spriteSheet;
                if (sprite.colorType == SpriteColorType.GLOW)
                    spriteSheet = SpriteSheet.GLOW;
                
                const zlayerNum: number = +object.zlayer;
                const spriteSheetNum: number = +spriteSheet;

                if (!sprites[zlayerNum]) sprites[zlayerNum] = {};
                if (!sprites[zlayerNum][spriteSheetNum]) sprites[zlayerNum][spriteSheetNum] = [];
                sprites[zlayerNum][spriteSheetNum].push([object, sprite]);
            }
        }

        this.spriteBatch = new SpriteBatch(this.level, this.renderer, ZLayer.B1, SpriteSheet.GAME_1);

        for (let zlayer = 0; zlayer < +ZLayer.COUNT; zlayer++) {
            for (let spriteSheet of SPRITE_SHEET_DRAW_ORDER) {
                if (!sprites[zlayer] || !sprites[zlayer][+spriteSheet])
                    continue;
                for (const [object, sprite] of sprites[zlayer][+spriteSheet])
                    this.spriteBatch.addObjectSprite(object, sprite);
            }
        }

        const program = this.renderer.ctx.program;
        if (!program)
            return;

        this.spriteBatch.generateIndexBufferWithAllObjects();
        this.spriteBatch.generateAndCleanUp(program);
        */

        for (const objects of objectsSortedByZOrder)
            this.insertObjectIntoBatch(objects);
    }

    private insertObjectIntoBatch(object: GameObject) {
        const objectInfo = GameObject.getObjectInfo(object.id);
        if (!objectInfo)
            return;

        for (const sprite of objectInfo.sprites)
            this.insertObjectSpriteIntoBatch(object, sprite, objectInfo.spriteSheet);
    }

    private insertObjectSpriteIntoBatch(object: GameObject, sprite: ObjectSprite, spriteSheet: SpriteSheet) {
        if (sprite.colorType == SpriteColorType.GLOW)
            spriteSheet = SpriteSheet.GLOW;

        const batch = this.fetchSpriteBatch(object.zlayer, spriteSheet);

        batch.addObjectSprite(object, sprite);
    }

    private fetchSpriteBatch(zlayer: ZLayer, spriteSheet: SpriteSheet): SpriteBatch {
        const zlayerNum: number = +zlayer;
        const spriteSheetNum: number = +spriteSheet;

        if (!this.spriteBatches[zlayerNum])
            this.spriteBatches[zlayerNum] = {};

        if (!this.spriteBatches[zlayerNum][spriteSheetNum])
            this.spriteBatches[zlayerNum][spriteSheetNum] = new SpriteBatch(this.level, this.renderer, zlayer, spriteSheet);

        return this.spriteBatches[zlayerNum][spriteSheetNum];
    }

    prepareForBlendingStates(blendingStates: { [channel: number]: boolean }, blendingStatesId: number) {
        for (const list of Object.values(this.spriteBatches))
            for (const batch of Object.values(list)) {
                batch.generateIndiciesWithBlendingStates(blendingStates, blendingStatesId);
            }
    }

    finishUp() {
        const program = this.renderer.ctx.program;
        if (!program)
            return;

        for (const list of Object.values(this.spriteBatches))
            for (const batch of Object.values(list)) {
                batch.generateAndCleanUp(program);
            }
    }

    render(blendingStatesId: number) {
        console.log("Rendering frame!");
        for (let zlayer = 0; zlayer < +ZLayer.COUNT; zlayer++) {
            for (let spriteSheet of SPRITE_SHEET_DRAW_ORDER) {
                if (!this.spriteBatches[zlayer] || !this.spriteBatches[zlayer][+spriteSheet])
                    continue;
                this.spriteBatches[zlayer][+spriteSheet].render(blendingStatesId);
            }
        }
    }

    renderAll() {
        this.spriteBatch?.renderAll();
    }
};