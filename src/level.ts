import { GameObject, ObjectProperties, ObjectPropertyReader } from "./object/object";
import { PortalSpeed } from "./object/speed-portal";
import { StopTrigger } from "./object/trigger/stop-trigger";
import { Renderer } from "./renderer";
import { Color } from "./util/color";
import { GroupManager } from "./group-manager";
import { ObjectHSVManager } from "./objecthsv";
import { StopTriggerTrackList } from "./track/stop-trigger-track";
import { GameState } from "./game-state";
import { LevelDecoder, LevelFileExtension } from "./level-decoder";
import { TransformManager } from "./transform/transform-manager";
import { LevelGraphics } from "./level-graphics";
import { SpeedManager } from "./speed-manager";
import { Trigger } from "./object/trigger/trigger";
import { ITriggerTrackList } from "./track/trigger-track";
import { ColorManager } from "./color-manager";
import { Vec2 } from "./util/vec2";
import { TriggerSimulator } from "./trigger-simulator";

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
    BLACK = 1010,
    COUNT = 1101
};

export class Level {
    private objects: GameObject[] = [];

    public stopTrackList: StopTriggerTrackList;

    songOffset: number = 0;
    backgroundId: number = 0;
    groundId: number = 0;

    validColorChannels: Set<number> = new Set<number>();

    public speedManager: SpeedManager;
    public colorManager: ColorManager;
    public groupManager: GroupManager;
    public transformManager: TransformManager;

    simulator: TriggerSimulator;

    objectHSVManager: ObjectHSVManager;
    objectHSVsLoaded: boolean = false;

    lastObjectXPosition: number = 0;

    levelGraphicsList: LevelGraphics[] = [];
    
    gamemodePortals: GameObject[] = [];

    constructor() {
        this.speedManager = new SpeedManager();
        this.colorManager = new ColorManager(this);
        this.groupManager = new GroupManager(this);
        this.transformManager = new TransformManager(this, this.groupManager);
        this.objectHSVManager = new ObjectHSVManager(this);

        this.simulator = new TriggerSimulator(this);
        
        this.stopTrackList = new StopTriggerTrackList(this);
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
        let props: {[_: string]: string} = {};

        for (let p = 0; p < psplit.length; p += 2)
            props[psplit[p]] = psplit[p + 1];

        const rd = new ObjectPropertyReader(props);
        
        const speed = rd.number('kA4', 0);
        level.speedManager.startSpeed = Level.getLevelSpeedEnum(speed);
        
        level.songOffset   = rd.number('kA13', 0);
        level.backgroundId = rd.number('kA6', 1);
        level.groundId     = rd.number('kA7', 1);

        if (props['kS38']) {
            for (let colorStr of props['kS38'].split('|'))
                level.colorManager.parseStartColor(colorStr);
        }
    }

    static parseObject(rd: ObjectPropertyReader): GameObject | null {
        let id = rd.number(1, 1);

        let obj = GameObject.create(id);
        obj.applyProperties(rd);

        return obj;
    }

    static parse(data: string): Level {
        let level = new Level();

        let split = data.split(';');

        this.parseLevelProps(level, split[0]);

        const rd = new ObjectPropertyReader();

        for (let i = 1; i < split.length; i++) {
            let psplit = split[i].split(',');
            let props: ObjectProperties = {};

            for (let p = 0; (p + 1) < psplit.length; p += 2) {
                const key = +psplit[p];
                if (isNaN(key))
                    continue;

                props[key] = psplit[p + 1];
            }

            rd.properties = props;

            const object = this.parseObject(rd);

            // This might not be a good idea, it's supposed to remove that one default block
            if (i == split.length - 1 && (object?.id ?? 1) == 1)
                continue;
            
            if (object != null)
                level.insertObject(object);
        }

        level.init();
        return level;
    }

    static async parseAsync(data: string): Promise<Level> {
        return this.parse(data);
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
        return this.objects;
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

/*
    public updateStopActions(id: number | null = null) {
        this.colorManager.updateStopActions(id);
        this.groupManager.updateStopActions(id);
    }
*/

    gameStateAtPos(pos: number): GameState {
        let approxYPos = 0;

        for (let portal of this.gamemodePortals) {
            if (portal.x <= pos) {
                approxYPos = portal.y;
                break;
            }
        }

        let state = new GameState();
        state.approxYPos = approxYPos;
        return state;
    }

    getPlayerPositionAtTime(time: number): Vec2 {
        const posX  = this.posAt(time);
        const state = this.gameStateAtPos(posX);
        return new Vec2(posX, state.approxYPos);
    }

    public getTrackListForTrigger(trigger: Trigger): ITriggerTrackList | null {
        if (trigger instanceof StopTrigger)
            return this.stopTrackList;

        const list = this.colorManager.getTrackListForTrigger(trigger);
        if (list) return list;

        return this.groupManager.getTrackListForTrigger(trigger);
    }

    private createLevelGraphics(renderer: Renderer): LevelGraphics {
        const gfx = new LevelGraphics(this, renderer);
        gfx.initWithObjects(this.objects);

        let i = 0;
        for (const section of this.colorManager.blendingStates)
            gfx.prepareForBlendingStates(section.states, i++);
        gfx.finishUp();

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

    public insertObject(object: GameObject): void {
        object.insertObject(this);
        this.objects.push(object);
    }

    init() {
        this.gamemodePortals = [];
        for (let obj of this.objects) {
            if ([12, 13, 47, 111, 660, 745, 1331].includes(obj.id))
                this.gamemodePortals.push(obj);

            if (obj.x > this.lastObjectXPosition)
                this.lastObjectXPosition = obj.x;
        }
        this.gamemodePortals.sort((a, b) => a.x - b.x);

        this.colorManager.calculateBlendingStates();

        this.groupManager.loadGroups();
        this.groupManager.compressLargeGroupCombinations(4);

        const simulateTimeLimit = this.timeAt(this.lastObjectXPosition) + 10;

        this.simulator.init();
        this.simulator.simulateUntil(simulateTimeLimit);

        this.transformManager.prepare();
        this.transformManager.simulateUntil(simulateTimeLimit);

        this.objectHSVManager.reset();
        this.objectHSVManager.loadObjectHSVs();

        for (let obj of this.objects) {
            if (obj.baseColorChannel != 0)
                this.validColorChannels.add(obj.baseColorChannel);

            if (obj.detailColorChannel != 0)
                this.validColorChannels.add(obj.detailColorChannel);
        }
    }
}