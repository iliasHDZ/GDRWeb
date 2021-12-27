import { GDObject } from "./object/object";
import { PortalSpeed, SpeedPortal } from "./object/speed-portal";
import { ColorTrigger } from "./object/color-trigger";
import { ObjectCollection } from "./render/object-collection";
import { GDRWebRenderer } from "./renderer";
import { Color } from "./util/color";
import { GDColor } from "./util/gdcolor";
import { BaseColor } from "./util/basecolor";
import { PlayerColor } from "./util/playercolor";
import { MixedColor } from "./util/mixedcolor";
import { Mat3 } from "./util/mat3";
import { SpriteCrop } from "./util/spritecrop";
import { Vec2 } from "./util/vec2";

export class GDLevel {
    private data: GDObject[] = [];

    private speedportals:  number[];
    private colortriggers: {};

    renderer: GDRWebRenderer;
    level_col: ObjectCollection;

    speed: PortalSpeed;
    song_offset: number;

    valid_channels: number[];

    start_colors: {};

    constructor(renderer: GDRWebRenderer) {
        this.renderer = renderer;
    }

    static parseStartColor(level: GDLevel, str: string) {
        let psplit = str.split('_');
        let props  = {};

        for (let p = 0; p < psplit.length; p += 2)
            props[+psplit[p]] = psplit[p + 1];

        let r = GDObject.parse(props[1], 'number', 255);
        let g = GDObject.parse(props[2], 'number', 255);
        let b = GDObject.parse(props[3], 'number', 255);

        let plr = GDObject.parse(props[4], 'number', 0);
        let blending = GDObject.parse(props[5], 'boolean', false);

        let id = GDObject.parse(props[6], 'number', 1);
        let a = GDObject.parse(props[7], 'number', 1);

        let color: GDColor;

        if (plr != -1)
            color = new PlayerColor(plr - 1, a, blending);
        else
            color = new BaseColor(r, g, b, a, blending);

        level.start_colors[id] = color;
    }

    static parseLevelProps(level: GDLevel, str: string) {
        let psplit = str.split(',');
        let props  = {};

        for (let p = 0; p < psplit.length; p += 2)
            props[psplit[p]] = psplit[p + 1];
        
        // TODO: The speed enum and gd's enum probably don't match up, pls fix!!!
        level.speed = GDObject.parse(props['kA4'], 'number', PortalSpeed.ONE);
        
        level.song_offset = GDObject.parse(props['kA13'], 'number', 0);

        if (props['kS38']) {
            level.start_colors = {};

            for (let c of props['kS38'].split('|'))
                this.parseStartColor(level, c);
        }
    }

    static getObject(data: {}): GDObject {
        let id = data[1] || 1;

        let o: GDObject;
    
        if (SpeedPortal.isOfType(id))
            o = new SpeedPortal();
        else if (ColorTrigger.isOfType(id))
            o = new ColorTrigger();
        else
            o = new GDObject();
    
        o.applyData(data);
        return o;
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
            
            level.data.push(this.getObject(props));
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

    getStartColor(ch: number): GDColor {
        if (!this.start_colors[ch])
            return new BaseColor(255, 255, 255, 1, false);

        return this.start_colors[ch];
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

    getPlayerColor(plrcol: number, opacity: number): Color {
        if (plrcol == 0)
            return new Color(1.0, 0.3, 0.3, opacity);
        else if (plrcol == 1)
            return new Color(0.3, 1.0, 0.3, opacity);

        return new Color(0, 0, 0, opacity);
    }
    
    static mixGDColors(col1: GDColor, col2: GDColor, mix: number): GDColor {
        if (col1 instanceof BaseColor && col2 instanceof BaseColor)
            return BaseColor.fromColor(col1.evaluate(null).blend(col2.evaluate(null), mix), mix <= 0 ? col1.blending : col2.blending);

        if (mix == 0)
            return col1;

        if (mix == 1)
            return col2;

        return new MixedColor(col1, col2, mix);
    }

    colorTriggerBlend(tx: number, x: number, dur: number, from: GDColor, to: GDColor): GDColor {
        if (dur <= 0)
            return to;
        else
            return GDLevel.mixGDColors(from, to, ( this.timeAt(x) - this.timeAt(tx) ) / dur);
    }

    gdColorAt(ch: number, x: number): GDColor {
        if (ch == 1010)
            return new BaseColor(0, 0, 0, 1, false);
        else if (ch == 1011)
            return new BaseColor(1, 1, 1, 1, false);

        let lct: ColorTrigger = null, col = this.getStartColor(ch);

        for (let i of this.colortriggers[ch]) {
            let ct = this.data[i] as ColorTrigger;

            if (!ct) continue;

            if (ct.x >= x) break;

            if (lct)
                col = this.colorTriggerBlend(lct.x, ct.x, lct.duration, col, lct.getColor());

            lct = ct;
        }

        if (lct != null) {
            let ca = this.colorTriggerBlend(lct.x, x, lct.duration, col, lct.getColor());
            return ca;
        } else
            return col;
    }

    colorAt(ch: number, x: number): Color {
        return this.gdColorAt(ch, x).evaluate(this);
    }

    addTexture(obj: GDObject, s: SpriteCrop, color: number) {
        this.level_col.add(this.getModelMatrix(obj), color, s);
    }

    loadSpeedPortals() {
        this.speedportals = [];

        for (let i = 0; i < this.data.length; i++)
            if (this.data[i] && this.data[i] instanceof SpeedPortal)
                this.speedportals.push(i);

        this.speedportals.sort((a, b) => this.data[a].x - this.data[b].x);
    }

    loadColorTriggers() {
        this.colortriggers = {};

        for (let i = 0; i < this.data.length; i++) {
            let o = this.data[i];
            
            if (o && o instanceof ColorTrigger) {
                if (!this.colortriggers[o.color])
                    this.colortriggers[o.color] = [];

                this.colortriggers[o.color].push(i);
            }
        }

        for (let [k, v] of Object.entries(this.colortriggers))
            (v as number[]).sort((a, b) => this.data[a].x - this.data[b].x);
    }

    init() {
        this.level_col = new ObjectCollection(this.renderer.ctx, this.renderer.sheet);

        this.loadSpeedPortals();
        this.loadColorTriggers();

        let data: [GDObject, number][] = [];

        let ind = 0;

        for (let o of this.data)
            data.push([o, ind++]);

        data.sort((a, b) => {
            let r = GDObject.compareZOrder(a[0], b[0]);
            if (r != 0) return r;

            return a[1] - b[1];
        });

        this.valid_channels = [];

        for (let [o] of data) {
            let def = GDRWebRenderer.objectData[o.id];
            if (!def) continue;

            if (def.detailSprite)
                if (def.spriteNoColor)
                    this.addTexture(o, def.detailSprite, o.baseCol);
                else
                    this.addTexture(o, def.detailSprite, o.detailCol);

            if (def.baseSprite)
                if (def.spriteNoColor)
                    this.addTexture(o, def.baseSprite, 0);
                else
                    this.addTexture(o, def.baseSprite, o.baseCol);

            if (o.baseCol != 0 && !this.valid_channels.includes(o.baseCol))
                this.valid_channels.push(o.baseCol);

            if (o.detailCol != 0 && !this.valid_channels.includes(o.detailCol))
                this.valid_channels.push(o.detailCol);
        }

        this.level_col.compile();
    }
}