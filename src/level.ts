import { GameObject } from "./object/object";
import { PortalSpeed, SpeedPortal } from "./object/speed-portal";
import { ColorTrigger, ColorTriggerValue } from "./object/trigger/color-trigger";
import { AlphaTrigger } from "./object/trigger/alpha-trigger";
import { PulseTargetType, PulseTrigger, PulseTriggerValue } from "./object/trigger/pulse-trigger";
import { MoveTrigger } from "./object/trigger/move-trigger";
import { ToggleTrigger } from "./object/trigger/toggle-trigger";
import { StopTrigger } from "./object/trigger/stop-trigger";
import { Renderer } from "./renderer";
import { Color } from "./util/color";
import { GDColor } from "./util/gdcolor";
import { BaseColor } from "./util/basecolor";
import { PlayerColor } from "./util/playercolor";
import { CopyColor } from "./util/copycolor";
import { ValueTriggerTrack, ValueTriggerTrackList } from "./track/value-trigger-track";
import { GroupManager } from "./group-manager";
import { HSVShift, hsv2rgb, rgb2hsv } from "./util/hsvshift";
import { ObjectHSVManager } from "./objecthsv";
import { ValueTrigger } from "./object/trigger/value-trigger";
import { Profiler } from "./profiler";
import { StopTriggerTrackList } from "./track/stop-trigger-track";
import { GameState } from "./game-state";
import { LevelDecoder, LevelFileExtension } from "./level-decoder";

import { TransformManager } from "./transform/transform-manager";
import { RotateTrigger } from "./object/trigger/rotate-trigger";
import { LevelGraphics } from "./level-graphics";
import { SpeedManager } from "./speed-manager";
import { Trigger } from "./object/trigger/trigger";
import { TriggerTrackList } from "./track/trigger-track";
import { ColorManager } from "./color-manager";

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

export class Level {
    private data: GameObject[] = [];

    public stopTrackList: StopTriggerTrackList;

    song_offset: number = 0;
    backgroundId: number = 0;
    groundId: number = 0;

    loadProgEvent: (percent: number) => void | null = null;

    valid_channels: number[];

    validColorChannels: Set<number> = new Set<number>();

    public speedManager: SpeedManager;
    public colorManager: ColorManager;
    public groupManager: GroupManager;
    public transformManager: TransformManager;

    objectHSVManager: ObjectHSVManager;
    objectHSVsLoaded: boolean = false;

    levelGraphicsList: LevelGraphics[] = [];
    
    gamemodePortals: GameObject[];

    profiler: Profiler;

    constructor() {
        this.speedManager = new SpeedManager();
        this.colorManager = new ColorManager(this);
        this.groupManager = new GroupManager(this);
        this.transformManager = new TransformManager(this, this.groupManager);
        this.objectHSVManager = new ObjectHSVManager(this);
        
        this.stopTrackList = new StopTriggerTrackList(this);

        this.profiler = new Profiler();
    }

    setProgress(step: number, percent: number) {
        if (this.loadProgEvent != null)
            this.loadProgEvent(step / LOADING_STEPS_COUNT + percent / LOADING_STEPS_COUNT);
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

    static parseLevelProps(level: Level, str: string) {
        let psplit = str.split(',');
        let props  = {};

        for (let p = 0; p < psplit.length; p += 2)
            props[psplit[p]] = psplit[p + 1];
        
        const speed = GameObject.parse(props['kA4'], 'number', 0);
        level.speedManager.startSpeed = Level.getLevelSpeedEnum(speed);
        
        level.song_offset = GameObject.parse(props['kA13'], 'number', 0);
        level.backgroundId = GameObject.parse(props['kA6'], 'number', 1);
        level.groundId = GameObject.parse(props['kA7'], 'number', 1);

        if (props['kS38']) {
            for (let colorStr of props['kS38'].split('|'))
                level.colorManager.parseStartColor(colorStr);
        }
    }

    static parseObject(data: {}): GameObject | null {
        let id = +data[1] ?? 1;

        let obj = GameObject.create(id);
        obj.applyData(data);

        return obj;
    }

    static parse(data: string, loadProg: (percent: number) => void | null = null): Level {
        let level = new Level();
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

            const obj = this.parseObject(props);
            
            if (obj != null)
                level.insertObject(obj);

            if (i % 1000 == 1)
                level.setProgress(0, i / split.length);
        }

        level.init();
        return level;
    }

    static async parseAsync(data: string, loadProg: (percent: number) => void | null = null): Promise<Level> {
        return this.parse(data, loadProg);
    }

    static fromBase64String(data: string): Level {
        let decoder = new LevelDecoder();
        decoder.decodeBase64Level(data);

        return Level.parse(decoder.levelString);
    }

    static async loadFromFile(path: string, extension: LevelFileExtension = "auto"): Promise<Level> {
        let decoder = new LevelDecoder();
        await decoder.decodeFromFile(path, extension);

        return Level.parse(decoder.levelString);
    }

    getObjects(): GameObject[] {
        return this.data;
    }

    timeAt(x: number): number {
        return this.speedManager.timeAt(x);
    }

    posAt(s: number): number {
        return this.speedManager.posAt(s);
    }

    getPlayerColor(plrcol: number, opacity: number): Color {
        if (plrcol == 0)
            return new Color(1.0, 0.3, 0.3, opacity);
        else if (plrcol == 1)
            return new Color(0.3, 1.0, 0.3, opacity);

        return new Color(0, 0, 0, opacity);
    }

    public colorAtTime(ch: number, time: number): [Color, boolean] {
        return this.colorManager.colorAtTime(ch, time);
    }

    public colorAtPos(ch: number, x: number): [Color, boolean] {
        return this.colorManager.colorAtPos(ch, x);
    }

    public updateStopActions(id: number | null = null) {
        this.colorManager.updateStopActions(id);
        this.groupManager.updateStopActions(id);
        this.transformManager.updateStopActions(id);
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

    public getTrackListForTrigger(trigger: Trigger): TriggerTrackList | null {
        if (trigger instanceof StopTrigger)
            return this.stopTrackList;

        const list = this.colorManager.getTrackListForTrigger(trigger);
        if (list) return list;

        return this.groupManager.getTrackListForTrigger(trigger);
    }

    private insertObjectsIntoBatch(objects: GameObject[]): void {
        for (let gfx of this.levelGraphicsList) {
            gfx.insertObjects(objects);
        }
    }

    private removeObjectsFromBatch(objects: GameObject[]): void {
        for (let gfx of this.levelGraphicsList) {
            gfx.removeObjects(objects);
        }
    }

    public insertObjects(objects: GameObject[]): void {
        for (let obj of objects) {
            obj.insertObject(this);
            this.data.push(obj);
        }

        this.insertObjectsIntoBatch(objects);
    }

    public insertObject(object: GameObject): void {
        object.insertObject(this);
        this.data.push(object);

        this.insertObjectsIntoBatch([object]);
    }

    public removeObjects(objects: GameObject[]): void {
        for (let obj of objects) {
            obj.removeObject(this);
            const idx = this.data.indexOf(obj);
            if (idx != -1)
                this.data.splice(idx, 0);
        }

        this.removeObjectsFromBatch(objects);
    }

    public removeObject(object: GameObject): void {
        object.removeObject(this);
        const idx = this.data.indexOf(object);
        if (idx != -1)
            this.data.splice(idx, 0);

        this.removeObjectsFromBatch([object]);
    }

    private createLevelGraphics(renderer: Renderer): LevelGraphics {
        const gfx = new LevelGraphics(this, renderer);
        gfx.insertObjects(this.data);
        this.levelGraphicsList.push(gfx);
        return gfx;
    }

    public fetchLevelGraphics(renderer: Renderer): LevelGraphics {
        for (let gfx of this.levelGraphicsList) {
            if (gfx.renderer == renderer)
                return gfx;
        }

        return this.createLevelGraphics(renderer);
    }

    init() {
        this.setProgress(1, 0);

        this.groupManager.loadGroups();
        this.groupManager.compressLargeGroupCombinations(4);

        this.transformManager.prepare();

        this.objectHSVManager.reset();
        this.objectHSVManager.loadObjectHSVs();

        this.gamemodePortals = [];
        for (let obj of this.data) {
            if ([12, 13, 47, 111, 660, 745, 1331].includes(obj.id))
                this.gamemodePortals.push(obj);
        }
        this.gamemodePortals.sort((a, b) => a.x - b.x);

        let data: [GameObject, number, boolean][] = [];

        let ind = 0;

        for (let o of this.data) {
            if (o.x == 0 && o.y == 0 && o.id == 1)
                continue;
            data.push([o, ind++, this.colorManager.isObjectBlending(o)]);
        }

        this.setProgress(8, 0);
        data.sort((a, b) => {
            let r = GameObject.compareZOrder(a[0], b[0], a[2], b[2]);
            if (r != 0) return r;

            return a[1] - b[1];
        });

        this.valid_channels = [0];

        for (let [obj] of data) {
            if (obj.baseCol != 0 && !this.valid_channels.includes(obj.baseCol))
                this.valid_channels.push(obj.baseCol);

            if (obj.detailCol != 0 && !this.valid_channels.includes(obj.detailCol))
                this.valid_channels.push(obj.detailCol);
        }
    }
}