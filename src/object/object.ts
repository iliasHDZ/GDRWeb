import { Renderer } from "../renderer";
import { GDObjectsInfo, ZLayer } from "./info/object-info";
import { ObjectSpriteColor } from "./info/object-sprite";
import { Mat3 } from "../util/mat3";
import { AlphaTrigger, ColorTrigger, Level, MoveTrigger, PulseTrigger, RotateTrigger, SpeedPortal, StopTrigger, ToggleTrigger, Vec2 } from "..";
import { HSVShift } from "../util/hsvshift";
import { TextureObject } from "../render/texture-object";
import object_types from "../../assets/object_types.json";

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
    private _id: number;

    private _x: number;
    private _y: number;

    private _xflip: boolean;
    private _yflip: boolean;
    
    private _rotation: number;
    private _scale: number;
    
    private _zorder: number;
    private _zlayer: ZLayer;

    private _groups: number[];
    
    private _baseCol: number;
    private _detailCol: number;

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
     * The base color channel id of the GameObject.
     */
    public get baseCol(): number { return this._baseCol }

    /**
     * The detail color channel id of the GameObject.
     */
    public get detailCol(): number { return this._detailCol }

    /**
     * The base color HSV shift of the GameObject.
     */
    public get baseHSVShift(): HSVShift { return this._baseHSVShift }

    /**
     * The detail color HSV shift of the GameObject.
     */
    public get detailHSVShift(): HSVShift { return this._detailHSVShift }

    public groupComb: number;
    public baseHSVShiftId: number = 0;
    public detailHSVShiftId: number = 0;

    public uniqueId: number;
    static uniqueIdCounter: number = 0;

    level: Level | null = null;

    protected constructor(id: number) {
        this.uniqueId = GameObject.uniqueIdCounter++;

        this._id = id;
        this.resetValues();
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
    
        if (SpeedPortal.isOfType(id))
            obj = new SpeedPortal(id);
        else if (ColorTrigger.isOfType(id))
            obj = new ColorTrigger(id);
        else if (AlphaTrigger.isOfType(id))
            obj = new AlphaTrigger(id);
        else if (PulseTrigger.isOfType(id))
            obj = new PulseTrigger(id);
        else if (MoveTrigger.isOfType(id))
            obj = new MoveTrigger(id);
        else if (ToggleTrigger.isOfType(id))
            obj = new ToggleTrigger(id);
        else if (StopTrigger.isOfType(id))
            obj = new StopTrigger(id);
        else if (RotateTrigger.isOfType(id))
            obj = new RotateTrigger(id);
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

    onInsert(level: Level) {}

    onRemove(level: Level) {}

    resetValues() {
        this._x        = 0;
        this._y        = 0;
        this._xflip    = false;
        this._yflip    = false;
        this._rotation = 0;
        this._scale    = 1;
        this._groups   = [];

        const def = Renderer.objectInfo.getData(this.id);

        if (def) {
            this._zorder = def.zorder ?? 0;
            this._zlayer = def.zlayer ?? 0;
            this._baseCol   = def.baseCol ?? 0;
            this._detailCol = def.detailCol ?? 0;
        } else {
            this._zorder = 0;
            this._zlayer = 0;
            this._baseCol   = 0;
            this._detailCol = 0;
        }
    }

    static parse(data: string, type: string, def: any): any {
        if (!data) return def;

        switch (type) {
        case 'number':  return +data;
        case 'boolean': return data == '1';
        case 'array':
            let ret: number[] = [];
            for (let n of data.split('.'))
                if (!isNaN(+n))
                    ret.push(Math.floor(+n));
            return ret;
        default: 
            return def;
        }
    }

    static getZLayerValue(z: number): ZLayer {
        switch (z) {
        case -3: return ZLayer.B4;
        case -1: return ZLayer.B3;
        case  1: return ZLayer.B2;
        case  3: return ZLayer.B1;
        case  5: return ZLayer.T1;
        case  7: return ZLayer.T2;
        case  9: return ZLayer.T3;
        default: return null;
        }
    }

    applyData(data: {}) {
        this._id       = GameObject.parse(data[1],  'number',  1);
        this._x        = GameObject.parse(data[2],  'number',  0);
        this._y        = GameObject.parse(data[3],  'number',  0);
        this._xflip    = GameObject.parse(data[4],  'boolean', false);
        this._yflip    = GameObject.parse(data[5],  'boolean', false);
        this._rotation = GameObject.parse(data[6],  'number',  0);
        this._scale    = GameObject.parse(data[32], 'number',  1);
        this._groups   = GameObject.parse(data[57], 'array',   []);

        const baseShiftEnabled   = GameObject.parse(data[41], 'boolean', false);
        const detailShiftEnabled = GameObject.parse(data[42], 'boolean', false);

        if (baseShiftEnabled)
            this._baseHSVShift = HSVShift.parse(data[43]);
        if (detailShiftEnabled)
            this._detailHSVShift = HSVShift.parse(data[44]);

        const singleGroup = GameObject.parse(data[33], 'number', null);
        if (singleGroup)
            this.groups.push(singleGroup);

        this._zorder = GameObject.parse(data[25], 'number', this.zorder);
        this._zlayer = GameObject.getZLayerValue(GameObject.parse(data[24], 'number', null)) ?? this.zlayer;
        
        this._baseCol   = GameObject.parse(data[21], 'number', this.baseCol);
        this._detailCol = GameObject.parse(data[22], 'number', this.detailCol);
    }

    getColorChannel(spriteColor: ObjectSpriteColor): number {
        switch (spriteColor) {
        case ObjectSpriteColor.BLACK:
        case ObjectSpriteColor.BASE:   return this.baseCol;
        case ObjectSpriteColor.DETAIL: return this.detailCol;
        default:
            return 0;
        }
    }

    getModelMatrix(): Mat3 {
        let positionMatrix = new Mat3();
        let scaleMatrix = new Mat3();
        let rotationMatrix = new Mat3();

        let scale = new Vec2(this.scale, this.scale);

        if (this.xflip) scale.x *= -1;
        if (this.yflip) scale.y *= -1;

        positionMatrix.translate(new Vec2(this.x, this.y));
        scaleMatrix.scale(scale);
        rotationMatrix.rotate((-this.rotation) * Math.PI / 180);

        return positionMatrix.multiply(rotationMatrix).multiply(scaleMatrix);
    }

    generateBatchObjects(level: Level, renderInfo: GDObjectsInfo): TextureObject[] {
        const info = renderInfo.getData(this.id);
        if (!info) return [];

        let textures: TextureObject[] = [];

        if (info.rootSprite) {
            const groups = level.groupManager.getGroupCombination(this.groupComb ?? null);
            const transformId = level.transformManager.groupCombIdxToTransformIdx[this.groupComb] ?? 0;

            const baseHSVId   = this.baseHSVShiftId;
            const detailHSVId = this.detailHSVShiftId;

            info.rootSprite.enumerateAllByDepth(sprite => {
                let hsvId = 0;
                if (sprite.colorType == ObjectSpriteColor.BASE)
                    hsvId = baseHSVId;
                if (sprite.colorType == ObjectSpriteColor.DETAIL)
                    hsvId = detailHSVId;

                const objectMatrix = this.getModelMatrix();
                const spriteMatrix = sprite.getRenderModelMatrix();

                textures.push(new TextureObject(
                    objectMatrix.multiply(spriteMatrix),
                    this.getColorChannel(sprite.colorType),
                    sprite.sprite,
                    groups,
                    transformId,
                    new Vec2(this.x, this.y),
                    hsvId,
                    sprite.colorType == ObjectSpriteColor.BLACK,
                    object_types.triggers.includes(this.id)
                ));
            });
        }

        return textures;
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
            obj._baseCol   = randInt(1, 1010);
            obj._detailCol = randInt(1, 1010);
        }

        return obj;
    }

    static generateRandomObjects(count: number, props: RandomProps = {}): GameObject[] {
        const objs: GameObject[] = [];
        for (let i = 0; i < count; i++)
            objs.push(this.generateRandomObject(props));
        return objs;
    }

    batchObjectCount(renderInfo: GDObjectsInfo): number {
        const info = renderInfo.getData(this.id);
        if (!info) return 0;
        if (!info.rootSprite) return 0;

        let count = 0;
        info.rootSprite.enumerateAll(() => count++);

        return count;
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

    /*static fromLevelData(data: {}): GDObject {
        let id = data[1] || 1;

        let o: GDObject;

        if (SpeedPortal.isOfType(id))
            o = new SpeedPortal();

        o.applyData(data);
        return o;
    }*/

    static compareZOrder(o1: GameObject, o2: GameObject, ob1: boolean = false, ob2: boolean = false) {
        if (o1.zlayer != o2.zlayer) return o1.zlayer - o2.zlayer;

        if (ob1 != ob2)
            return +ob2 - +ob1;

        return o1.zorder - o2.zorder;
    }
}