import { GDObject } from "./object/object";
import { ObjectCollection } from "./render/object-collection";
import { GDRWebRenderer } from "./renderer";
import { Color } from "./util/color";
import { Mat3 } from "./util/mat3";
import { SpriteCrop } from "./util/spritecrop";
import { Vec2 } from "./util/vec2";

export class GDLevel {
    private data: GDObject[] = [];

    renderer: GDRWebRenderer;

    level_col: ObjectCollection;

    constructor(renderer: GDRWebRenderer) {
        this.renderer = renderer;
    }

    static parse(renderer: GDRWebRenderer, data: string): GDLevel {
        let level = new GDLevel(renderer);
        let split = data.split(';');

        for (let i = 1; i < split.length; i++) {
            let psplit = split[i].split(',');
            let props  = {};

            for (let p = 0; p < psplit.length; p += 2)
                props[+psplit[p]] = psplit[p + 1];
            
            level.data.push(GDObject.fromLevelData(props));
        }

        level.init();
        return level;
    }

    getModelMatrix(o: GDObject) {
        let def = GDRWebRenderer.objectData[o.id];
        if (!def) return;
        
        let m = new Mat3();

        let sx = def.width / 62 * 30, sy = def.height / 62 * 30;

        sx *= o.xflip ? -1 : 1;
        sy *= o.yflip ? -1 : 1;

        m.translate(new Vec2(o.x, o.y));

        if (o.rotation != 0)
            m.rotate((-o.rotation) * Math.PI / 180);

        m.scale(new Vec2(sx, sy));

        return m;
    }

    addTexture(obj: GDObject, s: SpriteCrop) {
        this.level_col.add(this.getModelMatrix(obj), Color.fromRGB(255, 255, 255), s);
    }

    init() {
        this.level_col = new ObjectCollection(this.renderer.ctx, this.renderer.sheet);

        let data = [];

        for (let o of this.data)
            data.push(o);

        data.sort(GDObject.compareZOrder);

        for (let o of data) {
            let def = GDRWebRenderer.objectData[o.id];
            if (!def) continue;

            if (def.baseSprite)
                this.addTexture(o, def.baseSprite);

            if (def.detailSprite)
                this.addTexture(o, def.baseSprite);
        }

        this.level_col.compile();
    }
}