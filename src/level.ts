import { GDObject } from "./object/object";
import { PortalSpeed, SpeedPortal } from "./object/speed-portal";
import { ColorTrigger, ColorTriggerValue } from "./object/trigger/color-trigger";
import { AlphaTrigger } from "./object/trigger/alpha-trigger";
import { PulseTargetType, PulseTrigger, PulseTriggerValue } from "./object/trigger/pulse-trigger";
import { MoveTrigger } from "./object/trigger/move-trigger";
import { ToggleTrigger } from "./object/trigger/toggle-trigger";
import { StopTrigger } from "./object/trigger/stop-trigger";
import { ObjectBatch } from "./render/object-batch";
import { Renderer } from "./renderer";
import { Color } from "./util/color";
import { GDColor } from "./util/gdcolor";
import { BaseColor } from "./util/basecolor";
import { PlayerColor } from "./util/playercolor";
import { CopyColor } from "./util/copycolor";
import { ObjectSprite, ObjectSpriteColor } from "./object/info/object-sprite";
import { ValueTriggerTrack, ValueTriggerTrackList } from "./track/value-trigger-track";
import { GroupManager } from "./groups";
import { HSVShift, hsv2rgb, rgb2hsv } from "./util/hsvshift";
import { ObjectHSVManager } from "./objecthsv";
import { ValueTrigger } from "./object/trigger/value-trigger";
import { Profiler } from "./profiler";
import { StopTriggerTrackList } from "./track/stop-trigger-track";
import { GameState } from "./game-state";
import { LevelDecoder, LevelFileExtension } from "./level-decoder";

import object_types from "../assets/object_types.json";

const LOADING_STEPS_COUNT = 10;

export enum ColorChannel {
    BG = 1000,
    G1 = 1001,
    LINE = 1002,
    CH_3DL = 1003,
    OBJ = 1004,
    P1 = 1005,
    P2 = 1006,
    LBG = 1007,
    G2 = 1009,
    BLACK = 1010
};

export class GDLevel {
    private data: GDObject[] = [];

    private speedportals: number[];

    private colorTrackList: ValueTriggerTrackList;
    private pulseTrackList: ValueTriggerTrackList;

    public stopTrackList: StopTriggerTrackList;

    renderer: Renderer;
    level_col: ObjectBatch;

    speed: PortalSpeed;
    song_offset: number;
    backgroundId: number;
    groundId: number;

    loadProgEvent: (percent: number) => void | null = null;

    valid_channels: number[];

    startColors: { [ch: number]: GDColor } = {};

    groupManager: GroupManager;
    objectHSVManager: ObjectHSVManager;

    objectHSVsLoaded: boolean = false;

    gamemodePortals: GDObject[];

    profiler: Profiler;

    constructor(renderer: Renderer) {
        this.renderer = renderer;

        this.groupManager = new GroupManager(this);
        this.objectHSVManager = new ObjectHSVManager(this);

        this.profiler = new Profiler();
    }

    setProgress(step: number, percent: number) {
        if (this.loadProgEvent != null)
            this.loadProgEvent(step / LOADING_STEPS_COUNT + percent / LOADING_STEPS_COUNT);
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

        let plr = GDObject.parse(props[4], 'number', -1);
        let blending = GDObject.parse(props[5], 'boolean', false);

        let id = GDObject.parse(props[6], 'number', 1);
        let a = GDObject.parse(props[7], 'number', 1);

        let copyId = GDObject.parse(props[9], 'number', 0);
        let copyOpacity = GDObject.parse(props[17], 'boolean', 0);
        let copyHsvShift = HSVShift.parse(props[10]);

        let color: GDColor;

        if (copyId != 0)
            color = new CopyColor(copyId, copyOpacity, copyHsvShift, a, blending);
        else if (plr != -1)
            color = new PlayerColor(plr - 1, a, blending);
        else
            color = new BaseColor(r, g, b, a, blending);

        level.startColors[id] = color;
    }

    static getLevelSpeedEnum(speed: number) {
        switch (speed) {
        default:
        case 0: return PortalSpeed.ONE;
        case 1: return PortalSpeed.HALF;
        case 2: return PortalSpeed.TWO;
        case 3: return PortalSpeed.THREE;
        case 4: return PortalSpeed.FOUR;
        }
    }

    static parseLevelProps(level: GDLevel, str: string) {
        let psplit = str.split(',');
        let props  = {};

        for (let p = 0; p < psplit.length; p += 2)
            props[psplit[p]] = psplit[p + 1];
        
        const speed = GDObject.parse(props['kA4'], 'number', 0);
        level.speed = GDLevel.getLevelSpeedEnum(speed);
        
        level.song_offset = GDObject.parse(props['kA13'], 'number', 0);
        level.backgroundId = GDObject.parse(props['kA6'], 'number', 1);
        level.groundId = GDObject.parse(props['kA7'], 'number', 1);

        if (props['kS38']) {
            for (let c of props['kS38'].split('|'))
                this.parseStartColor(level, c);
        }
    }

    static parseObject(level: GDLevel, data: {}): GDObject {
        let id = data[1] || 1;

        let obj: GDObject;
    
        if (SpeedPortal.isOfType(id))
            obj = new SpeedPortal(level);
        else if (ColorTrigger.isOfType(id))
            obj = new ColorTrigger(level);
        else if (AlphaTrigger.isOfType(id))
            obj = new AlphaTrigger(level);
        else if (PulseTrigger.isOfType(id))
            obj = new PulseTrigger(level);
        else if (MoveTrigger.isOfType(id))
            obj = new MoveTrigger(level);
        else if (ToggleTrigger.isOfType(id))
            obj = new ToggleTrigger(level);
        else if (StopTrigger.isOfType(id))
            obj = new StopTrigger(level);
        else
            obj = new GDObject(level);
    
        obj.applyData(data);
        return obj;
    }

    static parse(renderer: Renderer, data: string, loadProg: (percent: number) => void | null = null): GDLevel {
        let level = new GDLevel(renderer);
        if (loadProg != null)
            level.loadProgEvent = loadProg;

        level.setProgress(0, 0);

        let split = data.split(';');

        this.parseLevelProps(level, split[0]);

        for (let i = 1; i < split.length; i++) {
            let psplit = split[i].split(',');
            let props  = {};

            for (let p = 0; p < psplit.length; p += 2)
                props[+psplit[p]] = psplit[p + 1];
            
            level.data.push(this.parseObject(level, props));

            if (i % 1000 == 1)
                level.setProgress(0, i / split.length);
        }

        level.init();
        return level;
    }

    static async parseAsync(renderer: Renderer, data: string, loadProg: (percent: number) => void | null = null): Promise<GDLevel> {
        return this.parse(renderer, data, loadProg);
    }

    static fromBase64String(renderer: Renderer, data: string): GDLevel {
        let decoder = new LevelDecoder();
        decoder.decodeBase64Level(data);

        return GDLevel.parse(renderer, decoder.levelString);
    }

    static async loadFromFile(path: string, renderer: Renderer, extension: LevelFileExtension = "auto"): Promise<GDLevel> {
        let decoder = new LevelDecoder();
        await decoder.decodeFromFile(path, extension);

        return GDLevel.parse(renderer, decoder.levelString);
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

    gdColorAt(ch: number, time: number): GDColor {
        const col = this.colorTrackList.valueAt(ch, time);

        if (!(col instanceof ColorTriggerValue))
            return BaseColor.white();

        return col.color;
    }

    getLBG(time: number): [Color, boolean] {
        const [bg] = this.colorAtTime(ColorChannel.BG, time);
        const [p1] = this.colorAtTime(ColorChannel.P1, time);

        let hsv = rgb2hsv(bg.r, bg.g, bg.b);
        hsv[1] = Math.max(hsv[1] - 20, 0);

        const [r, g, b] = hsv2rgb(...hsv);
    
        return [p1.blend(new Color(r, g, b, 1), hsv[2] / 100), true];
    }

    colorAtTime(ch: number, time: number, iterations: number = 8): [Color, boolean] {
        let color: Color, blending: boolean;
        if (iterations == 8) this.profiler.start("Color Trigger Evaluation");
        if (ch == ColorChannel.LBG) {
            [color, blending] = this.getLBG(time);
        } else {
            [color, blending] = this.gdColorAt(ch, time).evaluate(this, time, iterations);
        }
        if (iterations == 8) this.profiler.end();

        if (iterations == 8) this.profiler.start("Pulse Trigger Evaluation");
        const pulse = this.pulseTrackList.combinedValueAt(ch, time) as PulseTriggerValue;
        color = pulse.applyToColor(color);
        if (iterations == 8) this.profiler.end();

        return [
            color,
            blending
        ];
    }

    colorAtPos(ch: number, x: number): [Color, boolean] {
        return this.colorAtTime(ch, this.timeAt(x));
    }

    gameStateAtPos(pos: number): GameState {
        let approxYPos = 0;

        for (let portal of this.gamemodePortals) {
            if (portal.x <= pos)
                approxYPos = portal.y;
        }

        let state = new GameState();
        state.approxYPos = approxYPos;
        return state;
    }

    addTexture(object: GDObject, sprite: ObjectSprite, groups: number[], hsvId: number) {
        const objectMatrix = object.getModelMatrix();
        const spriteMatrix = sprite.getRenderModelMatrix();

        this.level_col.add(
            objectMatrix.multiply(spriteMatrix),
            object.getColorChannel(sprite.colorType),
            sprite.sprite,
            groups,
            hsvId,
            sprite.colorType == ObjectSpriteColor.BLACK,
            object_types.triggers.includes(object.id)
        );
    }

    loadSpeedPortals() {
        this.speedportals = [];

        for (let i = 0; i < this.data.length; i++)
            if (this.data[i] && this.data[i] instanceof SpeedPortal)
                this.speedportals.push(i);

        this.speedportals.sort((a, b) => this.data[a].x - this.data[b].x);
    }

    loadColorTracks() {
        this.colorTrackList = new ValueTriggerTrackList(this, ColorTriggerValue.default());

        for (let [ch, color] of Object.entries(this.startColors))
            this.colorTrackList.createTrackWithStartValue(+ch, new ColorTriggerValue(color));

        this.colorTrackList.loadAllColorTriggers(p => this.setProgress(2, p));
    }

    loadPulseTracks() {
        this.pulseTrackList = new ValueTriggerTrackList(this, PulseTriggerValue.default());

        this.pulseTrackList.loadAllNonSpawnTriggers((trigger: ValueTrigger) => {
            if (!(trigger instanceof PulseTrigger))
                return null;

            if (trigger.targetType != PulseTargetType.CHANNEL || trigger.targetId == 0)
                return null;

            return trigger.targetId;
        }, p => this.setProgress(3, p));
    }

    isObjectBlending(object: GDObject): boolean {
        const track = this.colorTrackList.get(object.baseCol);
        if (track == null || !(track instanceof ValueTriggerTrack))
            return false;

        const exec = track.lastExecutionLeftOf(object.x);
        if (exec != null) {
            if (!(exec.trigger instanceof ColorTrigger))
                return false;

            return exec.trigger.blending;
        }

        if (!(track.startValue instanceof ColorTriggerValue))
            return false;

        return track.startValue.color.blending;
    }

    init() {
        this.level_col = new ObjectBatch(this.renderer.ctx, this.renderer.sheet0, this.renderer.sheet2);

        this.setProgress(1, 0);
        this.loadSpeedPortals();

        this.stopTrackList = new StopTriggerTrackList(this);
        this.stopTrackList.loadAllTriggers();

        this.loadColorTracks();
        this.loadPulseTracks();

        this.groupManager.reset();
        this.groupManager.loadGroups();
        this.groupManager.compressLargeGroupCombinations(4);
        this.groupManager.loadTriggers();

        this.objectHSVManager.reset();
        this.objectHSVManager.loadObjectHSVs();

        this.gamemodePortals = [];
        for (let obj of this.data) {
            if ([12, 13, 47, 111, 660, 745, 1331].includes(obj.id))
                this.gamemodePortals.push(obj);
        }
        this.gamemodePortals.sort((a, b) => a.x - b.x);

        let data: [GDObject, number, boolean][] = [];

        let ind = 0;

        for (let o of this.data) {
            if (o.x == 0 && o.y == 0 && o.id == 1)
                continue;
            data.push([o, ind++, this.isObjectBlending(o)]);
        }

        this.setProgress(8, 0);
        data.sort((a, b) => {
            let r = GDObject.compareZOrder(a[0], b[0], a[2], b[2]);
            if (r != 0) return r;

            return a[1] - b[1];
        });

        this.valid_channels = [0];

        let i = 0;
        for (let [obj] of data) {
            if (i % 1000 == 0)
                this.setProgress(9, i / data.length);
            i++;

            const info = Renderer.objectInfo.getData(obj.id);
            if (!info) continue;

            if (info.rootSprite) {
                const groups = this.groupManager.getGroupCombination(obj.groupComb ?? null);

                const baseHSVId   = obj.baseHSVShiftId;
                const detailHSVId = obj.detailHSVShiftId;

                info.rootSprite.enumerateAllByDepth(sprite => {
                    let hsvId = 0;
                    if (sprite.colorType == ObjectSpriteColor.BASE)
                        hsvId = baseHSVId;
                    if (sprite.colorType == ObjectSpriteColor.DETAIL)
                        hsvId = detailHSVId;

                    this.addTexture(obj, sprite, groups, hsvId);
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