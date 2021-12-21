import { RenderContext } from './context/context'
import { ObjectCollection } from './render/object-collection';
import { Texture } from './render/texture';
import { Color } from './util/color';
import { Mat3 } from './util/mat3';
import { Vec2 } from './util/vec2';
import { GDObjectData } from './object/object-data'

import objectDataList from '../assets/data.json';
import { GDLevel } from './level';
import { Camera } from './camera';

export class GDRWebRenderer {
    ctx: RenderContext;

    sheet: Texture;

    camera: Camera;

    static objectData = GDObjectData.fromObjectDataList(objectDataList);

    constructor(ctx: RenderContext, sheetpath: string) {
        this.ctx = ctx;

        this.sheet = new Texture(ctx);
        this.sheet.load(sheetpath);

        this.camera = new Camera(0, 0);
    }

    render(level: GDLevel) {
        this.ctx.clearColor(
            Color.fromRGB(0, 0, 128)
        );

        this.ctx.setViewMatrix(this.camera.getMatrix(this.ctx.canvas.width, this.ctx.canvas.height));

        this.ctx.render(level.level_col);
    }
}