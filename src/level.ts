import { GDObject } from "./object/object";
import { PortalSpeed, SpeedPortal } from "./object/speed-portal";
import { ColorTrigger, ColorTriggerValue } from "./object/trigger/color-trigger";
import { ObjectBatch } from "./render/object-batch";
import { Renderer } from "./renderer";
import { Color } from "./util/color";
import { GDColor } from "./util/gdcolor";
import { BaseColor } from "./util/basecolor";
import { PlayerColor } from "./util/playercolor";
import { MixedColor } from "./util/mixedcolor";
import { Mat3 } from "./util/mat3";
import { SpriteCrop, SpriteCropInfo } from "./util/sprite";
import { Vec2 } from "./util/vec2";
import { ObjectSprite } from "./object/info/object-sprite";
import { ValueTriggerTrack } from "./value-trigger-track";

function isSameSet(set1: number[], set2: number[]): boolean {
    if (set1.length != set2.length)
        return false;

    for (let a of set1)
        if (!set2.includes(a))
            return false;

    return true;
}

export class GDLevel {
    private data: GDObject[] = [];

    private speedportals:  number[];
    private colortriggers: {};

    private colorTracks: { [ch: number]: ValueTriggerTrack };

    renderer: Renderer;
    level_col: ObjectBatch;

    speed: PortalSpeed;
    song_offset: number;

    valid_channels: number[];

    startColors: { [ch: number]: GDColor };

    groupCombinations: { [comb: number]: number[] } = {};
    lastGroupCombIdx: number = 0;

    constructor(renderer: Renderer) {
        this.renderer = renderer;
    }

    static parseStartColor(level: GDLevel, str: string) {
        if (str == '')
            return;

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

        level.startColors[id] = color;
    }

    static parseLevelProps(level: GDLevel, str: string) {
        let psplit = str.split(',');
        let props  = {};

        for (let p = 0; p < psplit.length; p += 2)
            props[psplit[p]] = psplit[p + 1];
        
        // TODO: The speed enum and gd's enum probably don't match up, pls check!!!
        level.speed = GDObject.parse(props['kA4'], 'number', PortalSpeed.ONE);
        
        level.song_offset = GDObject.parse(props['kA13'], 'number', 0);

        if (props['kS38']) {
            level.startColors = {};

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

    static parse(renderer: Renderer, data: string): GDLevel {
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

    getObjects(): GDObject[] {
        return this.data;
    }

    getStartColor(ch: number): GDColor {
        if (!this.startColors[ch])
            return BaseColor.white();

        return this.startColors[ch];
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

    gdColorAt(ch: number, x: number): GDColor {
        const track = this.colorTracks[ch];
        if (!track)
            return BaseColor.white();

        const time = this.timeAt(x);
        const col = track.valueAt(time);

        if (!(col instanceof ColorTriggerValue))
            return BaseColor.white();

        return col.color;
    }

    colorAt(ch: number, x: number): [Color, boolean] {
        return this.gdColorAt(ch, x).evaluate(this);
    }

    addTexture(object: GDObject, sprite: ObjectSprite) {
        const objectMatrix = object.getModelMatrix();
        const spriteMatrix = sprite.getRenderModelMatrix();

        this.level_col.add(
            objectMatrix.multiply(spriteMatrix),
            object.getColorChannel(sprite.colorType),
            sprite.sprite
        );
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

    loadColorTracks() {
        this.colorTracks = {};

        for (let [ch, color] of Object.entries(this.startColors))
            this.colorTracks[ch] = new ValueTriggerTrack(new ColorTriggerValue(color));

        for (let obj of this.data) {
            if (!(obj && obj instanceof ColorTrigger))
                continue;

            if (!this.colorTracks[obj.color]) // TODO: Shorten the following line:
                this.colorTracks[obj.color] = new ValueTriggerTrack(new ColorTriggerValue(BaseColor.white()));
            
            this.colorTracks[obj.color].insertTrigger(obj, this.timeAt(obj.x));
        }
    }

    getGroupCombinationIdx(groups: number[]): number | null {
        for (let [k, v] of Object.entries(this.groupCombinations))
            if (isSameSet(v, groups))
                return +k;
        
        return null;
    }

    loadGroups() {
        for (let obj of this.data) {
            if (obj.groups.length == 0) continue;

            let idx = this.getGroupCombinationIdx(obj.groups);
            if (idx != null) {
                obj.groupComb = idx;
                continue;
            }

            idx = this.lastGroupCombIdx++;

            this.groupCombinations[idx] = obj.groups;
        }
    }

    init() {
        this.level_col = new ObjectBatch(this.renderer.ctx, this.renderer.sheet0, this.renderer.sheet2);

        this.loadSpeedPortals();
        this.loadGroups();
        //this.loadColorTriggers();
        this.loadColorTracks();

        let data: [GDObject, number][] = [];

        let ind = 0;

        for (let o of this.data)
            data.push([o, ind++]);

        data.sort((a, b) => {
            let r = GDObject.compareZOrder(a[0], b[0]);
            if (r != 0) return r;

            return a[1] - b[1];
        });

        this.valid_channels = [0];

        for (let [obj] of data) {
            const info = Renderer.objectInfo.getData(obj.id);
            if (!info) continue;

            if (info.rootSprite) {
                info.rootSprite.enumerateAllByDepth(sprite => {
                    this.addTexture(obj, sprite);
                });
            }

            if (obj.baseCol != 0 && !this.valid_channels.includes(obj.baseCol))
                this.valid_channels.push(obj.baseCol);

            if (obj.detailCol != 0 && !this.valid_channels.includes(obj.detailCol))
                this.valid_channels.push(obj.detailCol);
        }

        this.level_col.compile();
    }
}