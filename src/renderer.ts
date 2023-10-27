import { RenderContext } from './context/context'
import { ObjectCollection } from './render/object-collection';
import { Texture } from './render/texture';
import { Color } from './util/color';
import { Mat3 } from './util/mat3';
import { Vec2 } from './util/vec2';
import { GDObjectData, GDObjects } from './object/object-data'

import objectDataList from '../assets/objects.json';
// import objectDataList from '../assets/data.json';
import { GDLevel } from './level';
import { Camera } from './camera';
import { PlistAtlasLoader } from './object/plist-loader';
import { SpriteInfo } from './util/sprite';

export class Renderer {
    ctx: RenderContext;

    sheet0: Texture;
    sheet2: Texture;

    camera: Camera;

    static objectData: GDObjects = null;

    handlers: {} = {};

    constructor(ctx: RenderContext, sheetpath0: string, sheetpath2: string) {
        this.ctx = ctx;

        this.camera = new Camera(0, 0, 1);

        this.init(sheetpath0, sheetpath2);
    }

    public static async initTextureInfo(plistpath0: string, plistpath2: string) {
        if (this.objectData != null)
            return;

        const plist0 = await (new PlistAtlasLoader()).load(plistpath0, 0);
        const plist2 = await (new PlistAtlasLoader()).load(plistpath2, 2);
        
        let atlas: {[key: string]: SpriteInfo} = {};

        for (let [k, v] of Object.entries(plist0))
            atlas[k] = v;

        for (let [k, v] of Object.entries(plist2))
            atlas[k] = v;

        const data = GDObjectData.fromObjectDataList(objectDataList, atlas);

        Renderer.objectData = new GDObjects(atlas, data);
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

    screenToWorldPos(pos: Vec2): Vec2 {
        const x = ( pos.x - (this.ctx.canvas.width / 2) + this.camera.x  ) / this.camera.zoom;
        const y = ( (this.ctx.canvas.height / 2) - pos.y + this.camera.y ) / this.camera.zoom;

        return new Vec2(x, y);
    }

    render(level: GDLevel) {
        let bg = level.colorAt(1000, this.camera.x);
        this.ctx.clearColor(bg);

        this.ctx.setViewMatrix(this.camera.getMatrix(this.ctx.canvas.width, this.ctx.canvas.height));

        for (let c of level.valid_channels) {
            this.ctx.setColorChannel(c, level.colorAt(c, this.camera.x));
        }

        this.ctx.render(level.level_col);
    }
}