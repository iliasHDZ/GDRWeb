import { GDObject } from "./object/object";
import { ObjectCollection } from "./render/object-collection";
import { GDRWebRenderer } from "./renderer";
import { Color } from "./util/color";
import { Mat3 } from "./util/mat3";
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

    init() {
        let col = new ObjectCollection(this.renderer.ctx, this.renderer.sheet);

        for (let o of this.data) {
            let def = this.renderer.objectData[o.id];
            if (!def) continue;

            let m = new Mat3();

            m.translate(new Vec2(o.x, o.y));
            m.scale(new Vec2(def.width / 62 * 30, def.height / 62 * 30));
            
            col.add(m, Color.fromRGB(255, 255, 255), def.baseSprite);

            if (def.detailSprite) {
                m = new Mat3();

                m.translate(new Vec2(o.x, o.y));
                m.scale(new Vec2(def.width / 62 * 30, def.height / 62 * 30));

                col.add(m, Color.fromRGB(255, 255, 255), def.detailSprite);
            }
        }

        col.compile();

        this.level_col = col;
    }
}