import { RenderContext } from './context/context'
import { ObjectCollection } from './render/object-collection';
import { Color } from './util/color';
import { Mat3 } from './util/mat3';
import { Vec2 } from './util/vec2';

export class GDRWebRenderer {
    ctx: RenderContext;

    col: ObjectCollection;

    constructor(ctx: RenderContext) {
        this.ctx = ctx;

        this.col = new ObjectCollection(this.ctx);

        for (let i = 0; i < 100; i++) {
            let m = new Mat3();

            m.rotate(Math.random() * 2 * Math.PI);
            m.translate(new Vec2(Math.random() * 400 - 200, Math.random() * 400 - 200));
            m.scale(new Vec2(30, 30));

            this.col.add(m, Color.fromRGBA(255, 255, 255, 128));
        }

        this.col.compile();
    }

    render() {
        this.ctx.clearColor(
            Color.fromRGB(255, 0, 0)
        );

        this.ctx.render(this.col);
    }
}