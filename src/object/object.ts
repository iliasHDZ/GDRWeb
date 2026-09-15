import { ObjectInfo, SpriteColorType, ZLayer } from "./info/object-info";
import { Mat3 } from "../util/mat3";
import { AlphaTrigger, ColorTrigger, Level, MoveTrigger, PulseTrigger, RotateTrigger, ScaleTrigger, SpeedPortal, StopTrigger, ToggleTrigger, SpawnTrigger, Vec2 } from "..";
import { HSVShift } from "../util/hsvshift";
import object_types from "../../assets/object_types.json";
import objectDataList from '../../assets/object.json';

// TODO: Move this into utils somewhere
export function rand(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

// TODO: Move this into utils somewhere
export function randInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface RandomProps {
    ids?: number[];
    randTransform?: boolean;
    randLayering?: boolean;
    randColors?: boolean;
};

type ObjectPropertyKey = number | string;

export type ObjectProperties = { [key: ObjectPropertyKey]: string };

export class ObjectPropertyReader {
    properties: ObjectProperties = {};

    constructor(properties: ObjectProperties = {}) {
        this.properties = properties;
    }

    has(key: ObjectPropertyKey): boolean {
        const value = this.properties[key];
        return value != undefined && value != null;
    }

    number(key: ObjectPropertyKey, defaultValue: number): number {
        const value = this.properties[key];
        if (value == undefined || value == null)
            return defaultValue;
        const number = +value;
        if (isNaN(number))
            return defaultValue;
        return number;
    }

    bool(key: ObjectPropertyKey, defaultValue: boolean): boolean {
        const value = this.properties[key];
        if (value == undefined || value == null)
            return defaultValue;
        return value == '1';
    }

    intArray(key: ObjectPropertyKey): number[] {
        const value = this.properties[key];
        if (value == undefined || value == null)
            return [];
        let ret: number[] = [];
        for (let element of value.split('.')) {
            const number = +element;
            if (!isNaN(number))
                ret.push(Math.floor(number));
            else
                return [];
        }
        return ret;
    }

    hsvShift(key: ObjectPropertyKey): HSVShift {
        return HSVShift.parse(this.properties[key] ?? "");
    }
};

/**
 * GameObject represents one object in a Geometry Dash level. This can
 * be any solid object, trigger, gameplay element, etc. More specific
 * objects like triggers have their own classes inheriting from GameObject.
 * 
 * Creating an object can be done as such:
 * ```ts
 * // This creates a GameObject with ID 20:
 * let object = GameObject.create(20);
 * ```
 */
export class GameObject {
    private _id: number = 1;

    private _x: number = 0;
    private _y: number = 0;

    private _xflip: boolean = false;
    private _yflip: boolean = false;
    
    private _rotation: number = 0;
    private _scale: number = 1;

    private _scaleX: number = 1;
    private _scaleY: number = 1;
    private _warpXAngle: number = 0;
    private _warpYAngle: number = 0;
    
    private _zorder: number = 0;
    private _zlayer: ZLayer = ZLayer.B1;

    private _groups: number[] = [];
    private _parentGroups: number[] = [];
    
    private _baseColorChannel: number = 1;
    private _detailColorChannel: number = 1;

    private _baseHSVShift: HSVShift | null = null;
    private _detailHSVShift: HSVShift | null = null;

    /**
     * The Object ID of the GameObject
     */
    public get id(): number { return this._id }
    
    /**
     * The X coordinate of the GameObject (30 units per grid block)
     */
    public get x(): number { return this._x }
    
    /**
     * The Y coordinate of the GameObject (30 units per grid block)
     */
    public get y(): number { return this._y }

    /**
     * The X flip value of the GameObject. If true, it flips the object over the Y axis.
     */
    public get xflip(): boolean { return this._xflip }

    /**
     * The Y flip value of the GameObject. If true, it flips the object over the Y axis.
     */
    public get yflip(): boolean { return this._yflip }

    /**
     * The rotation value of the GameObject in degrees
     */
    public get rotation(): number { return this._rotation }

    /**
     * The scale value of the GameObject
     */
    public get scale(): number { return this._scale }

    /**
     * The zorder value of the GameObject
     */
    public get zorder(): number { return this._zorder }

    /**
     * The zlayer value of the GameObject
     */
    public get zlayer(): ZLayer { return this._zlayer }

    /**
     * The groups value of the GameObject. Contains array of group ids assigned to the object.
     */
    public get groups(): number[] { return this._groups }

    /**
     * The parent groups value of the GameObject. Contains array of group ids of which the object is the main object.
     */
    public get parentGroups(): number[] { return this._parentGroups }

    /**
     * The base color channel id of the GameObject.
     */
    public get baseColorChannel(): number { return this._baseColorChannel }

    /**
     * The detail color channel id of the GameObject.
     */
    public get detailColorChannel(): number { return this._detailColorChannel }

    /**
     * The base color HSV shift of the GameObject.
     */
    public get baseHSVShift(): HSVShift | null { return this._baseHSVShift }

    /**
     * The detail color HSV shift of the GameObject.
     */
    public get detailHSVShift(): HSVShift | null { return this._detailHSVShift }

    public get position(): Vec2 { return new Vec2(this.x, this.y); }

    public groupComb: number = 0;
    public baseHSVShiftId: number = 0;
    public detailHSVShiftId: number = 0;

    public uniqueId: number;
    static uniqueIdCounter: number = 0;

    private modelMatrix: Mat3 | null = null;

    level: Level | null = null;

    private static objectInfo: { [id: number]: ObjectInfo; } | null = null;

    protected constructor(id: number) {
        this.uniqueId = GameObject.uniqueIdCounter++;

        this._id = id;
        this.applyDefaultValues();
    }

    public static getObjectInfo(id: number): ObjectInfo | null {
        if (!this.objectInfo)
            this.objectInfo = ObjectInfo.fromJSONList(objectDataList as any);
        return this.objectInfo[id] ?? null;
    }

    /**
     * Creates a object with the specified id. It creates
     * an object from a specific object class if necessary.
     * 
     * @param id The ID of the GameObject to be created
     * @returns The returned GameObject
     */
    public static create(id: number): GameObject {
        let obj: GameObject;
    
        if (SpeedPortal.isOfType(id))        obj = new SpeedPortal(id);
        else if (ColorTrigger.isOfType(id))  obj = new ColorTrigger(id);
        else if (AlphaTrigger.isOfType(id))  obj = new AlphaTrigger(id);
        else if (PulseTrigger.isOfType(id))  obj = new PulseTrigger(id);
        else if (MoveTrigger.isOfType(id))   obj = new MoveTrigger(id);
        else if (RotateTrigger.isOfType(id)) obj = new RotateTrigger(id);
        else if (ScaleTrigger.isOfType(id))  obj = new ScaleTrigger(id);
        else if (ToggleTrigger.isOfType(id)) obj = new ToggleTrigger(id);
        else if (StopTrigger.isOfType(id))   obj = new StopTrigger(id);
        else if (SpawnTrigger.isOfType(id))  obj = new SpawnTrigger(id);
        else
            obj = new GameObject(id);

        return obj;
    }

    insertObject(level: Level) {
        this.level = level;
        this.onInsert(level);
    }

    removeObject(level: Level) {
        this.level = null;
        this.onRemove(level);
    }

    onInsert(_: Level) {}

    onRemove(_: Level) {}

    applyDefaultValues() {
        const def = GameObject.getObjectInfo(this.id);

        if (def) {
            this._zorder = def.defaultZOrder ?? 1;
            this._zlayer = def.defaultZLayer ?? ZLayer.B1;
            this._baseColorChannel   = def.defaultBaseColorChannel ?? 1;
            this._detailColorChannel = def.defaultDetailColorChannel ?? 1;
        }
    }

    static getZLayerValue(z: number): ZLayer | null {
        switch (z) {
        case -3: return ZLayer.B4;
        case -1: return ZLayer.B3;
        case  1: return ZLayer.B2;
        case  3: return ZLayer.B1;
        case  5: return ZLayer.T1;
        case  7: return ZLayer.T2;
        case  9: return ZLayer.T3;
        case 11: return ZLayer.T4;
        default: return null;
        }
    }

    applyProperties(rd: ObjectPropertyReader) {
        // console.log(rd.properties);

        this._id         = rd.number(1, 1);
        this._x          = rd.number(2, 0);
        this._y          = rd.number(3, 0);
        this._xflip      = rd.bool(4, false);
        this._yflip      = rd.bool(5, false);
        this._rotation   = rd.number(6,   0);
        this._scale      = rd.number(32,  1);
        this._scaleX     = rd.number(128, 1);
        this._scaleY     = rd.number(129, 1);
        this._warpXAngle = rd.number(131, 0);
        this._warpYAngle = rd.number(132, 0);
        this._groups     = rd.intArray(57);

        this._parentGroups = rd.intArray(274);

        const baseShiftEnabled   = rd.bool(41, false);
        const detailShiftEnabled = rd.bool(42, false);

        if (baseShiftEnabled)
            this._baseHSVShift = rd.hsvShift(43);
        if (detailShiftEnabled)
            this._detailHSVShift = rd.hsvShift(44);

        if (rd.has(33))
            this.groups.push(rd.number(33, 1));

        this._zorder = rd.number(25, this.zorder);
        if (rd.has(24))
            this._zlayer = GameObject.getZLayerValue(rd.number(24, 67)) ?? this.zlayer;
        
        this._baseColorChannel   = rd.number(21, this.baseColorChannel);
        this._detailColorChannel = rd.number(22, this.detailColorChannel);
    }

    getColorChannel(spriteColor: SpriteColorType): number {
        switch (spriteColor) {
        case SpriteColorType.GLOW:
        case SpriteColorType.BLACK:
        case SpriteColorType.BASE:   return this.baseColorChannel;
        case SpriteColorType.DETAIL: return this.detailColorChannel;
        default:
            return 0;
        }
    }

    getModelMatrix(): Mat3 {
        if (this.modelMatrix == null) {
            let positionMatrix = new Mat3();
            let scaleMatrix    = new Mat3();
            let rotationMatrix = new Mat3();

            let scale = new Vec2(
                this.scale * this._scaleX * (1 - +this.xflip * 2),
                this.scale * this._scaleY * (1 - +this.yflip * 2)
            );

            let rotationX = -(this.rotation + this._warpXAngle) * Math.PI / 180;
            let rotationY = -(this.rotation + this._warpYAngle) * Math.PI / 180;

            // not sure why it is flipped but oh well
            [rotationX, rotationY] = [rotationY, rotationX];

            positionMatrix = positionMatrix.translate(new Vec2(this.x, this.y));
            scaleMatrix    = scaleMatrix.scale(scale);
            rotationMatrix = rotationMatrix.rotateXY(rotationX, rotationY);

            this.modelMatrix = positionMatrix.multiply(rotationMatrix).multiply(scaleMatrix);
        }

        return this.modelMatrix;
    }

    isTrigger(): boolean {
        return object_types.triggers.includes(this.id);
    }

    static generateRandomObject(props: RandomProps = {}): GameObject {
        const obj = GameObject.create(props.ids ? props.ids[randInt(0, props.ids.length - 1)] : randInt(1, 1910));

        if (props.randTransform ?? false) {
            obj._x = rand(0, 1000);
            obj._y = rand(0, 1000);
            obj._xflip = Math.random() > 0.5;
            obj._yflip = Math.random() > 0.5;
            obj._rotation = rand(0, 360);
            obj._scale = rand(0.5, 2);
        }

        if (props.randLayering ?? false) {
            obj._zlayer = randInt(0, 6);
            obj._zorder = randInt(-20, 20);
        }

        if (props.randColors ?? false) {
            obj._baseColorChannel   = randInt(1, 1010);
            obj._detailColorChannel = randInt(1, 1010);
        }

        return obj;
    }

    static generateRandomObjects(count: number, props: RandomProps = {}): GameObject[] {
        const objs: GameObject[] = [];
        for (let i = 0; i < count; i++)
            objs.push(this.generateRandomObject(props));
        return objs;
    }

    spriteCount(): number {
        const info = GameObject.getObjectInfo(this.id);
        if (!info) return 0;
        return info.sprites.length;
    }

    static areObjectsSortedByZOrder(objs: GameObject[]): boolean {
        let prevObj: GameObject | null = null;

        for (let obj of objs) {
            if (prevObj && GameObject.compareZOrder(prevObj, obj) > 0)
                return false;

            prevObj = obj;
        }

        return true;
    }

    static sortObjectsByZOrder(objs: GameObject[]): GameObject[] {
        return objs.sort(GameObject.compareZOrder);
    }

    static compareZOrder(o1: GameObject, o2: GameObject, ob1: boolean = false, ob2: boolean = false) {
        if (o1.zlayer != o2.zlayer) return o1.zlayer - o2.zlayer;

        if (ob1 != ob2)
            return +ob2 - +ob1;

        return o1.zorder - o2.zorder;
    }
}