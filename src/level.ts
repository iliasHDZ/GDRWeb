import { GDObject } from "./object/object";
import { PortalSpeed, SpeedPortal } from "./object/speed-portal";
import { ObjectCollection } from "./render/object-collection";
import { GDRWebRenderer } from "./renderer";
import { Color } from "./util/color";
import { Mat3 } from "./util/mat3";
import { SpriteCrop } from "./util/spritecrop";
import { Vec2 } from "./util/vec2";

export class GDLevel {
    private data: GDObject[] = [];

    private speedportals: number[];

    renderer: GDRWebRenderer;
    level_col: ObjectCollection;

    speed: PortalSpeed;
    song_offset: number;

    constructor(renderer: GDRWebRenderer) {
        this.renderer = renderer;
    }

    static parseLevelProps(level: GDLevel, str: string) {
        let psplit = str.split(',');
        let props  = {};

        for (let p = 0; p < psplit.length; p += 2)
            props[psplit[p]] = psplit[p + 1];
        
        // TODO: The speed enum and gd's enum probably don't match up, pls fix!!!
        level.speed = GDObject.parse(props['kA4'], 'number', PortalSpeed.ONE);
        
        level.song_offset = GDObject.parse(props['kA13'], 'number', 0);
    }

    static parse(renderer: GDRWebRenderer, data: string): GDLevel {
        let level = new GDLevel(renderer);
        let split = data.split(';');

        this.parseLevelProps(level, split[0]);

        for (let i = 1; i < split.length; i++) {
            let psplit = split[i].split(',');
            let props  = {};

            for (let p = 0; p < psplit.length; p += 2)
                props[+psplit[p]] = psplit[p + 1];

            let id = props[1] || 1;

            let o: GDObject;
        
            if (SpeedPortal.isOfType(id))
                o = new SpeedPortal();
            else
                o = new GDObject();
        
            o.applyData(props);
            
            level.data.push(o);
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

    timeAt(x: number): number {
        let sec = 0, lx = 15, spd = SpeedPortal.getSpeed(this.speed);

        for (let i of this.speedportals) {
            let sp = this.data[i] as SpeedPortal;
            if (!sp) continue;

            if (sp.x >= x)
                break;

            let delta = sp.x - lx;
            if (delta < 0) continue;

            sec += delta / spd;
            lx  += delta;

            spd = SpeedPortal.getSpeed(sp.speed);
        }

        return sec + (x - lx) / spd;
    }

    posAt(s: number): number {
        let sec = 0, lx = 15, spd = SpeedPortal.getSpeed(this.speed);

        for (let i of this.speedportals) {
            let sp = this.data[i] as SpeedPortal;
            if (!sp) continue;

            let delta = sp.x - lx;
            if (delta < 0) continue;

            let tsec = sec + delta / spd;

            if (tsec >= s)
                break;

            sec =  tsec;
            lx  += delta;

            spd = SpeedPortal.getSpeed(sp.speed);
        }

        return lx + (s - sec) * spd;
    }

    addTexture(obj: GDObject, s: SpriteCrop) {
        this.level_col.add(this.getModelMatrix(obj), Color.fromRGB(255, 255, 255), s);
    }

    init() {
        this.level_col = new ObjectCollection(this.renderer.ctx, this.renderer.sheet);

        this.speedportals = [];

        for (let i = 0; i < this.data.length; i++)
            if (this.data[i] && this.data[i] instanceof SpeedPortal)
                this.speedportals.push(i);

        this.speedportals.sort((a, b) => this.data[a].x - this.data[b].x);

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