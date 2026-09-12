import { Mat3 } from "../../util/mat3";
import { Vec2 } from "../../util/vec2";
import { GameObject } from "../object";

export enum ZLayer {
    B4,
    B3,
    B2,
    B1,
    T1,
    T2,
    T3,
    T4,
    COUNT
}

export enum SpriteSheet {
    GAME_1,
    GAME_2,
    TEXT,
    FIRE,
    SPECIAL,
    GLOW,
    PIXEL,
    _UNK,
    PARTICLE
};

export enum SpriteColorType {
    BASE,
    DETAIL,
    BLACK,
    GLOW
}

export type ObjectInfoList = { [id: number]: ObjectInfo };

interface SpriteJson {
    texture: string;
    colorType: string;
    position: [number, number];
    scale: [number, number];
    contentSize: [number, number];
    spriteOffset: [number, number];
    flipX?: boolean;
    flipY?: boolean;
    rotation: number;
};

interface ObjectJson {
    defaultZOrder: number;
    defaultZLayer: number;
    defaultBaseColorChannel?: number;
    defaultDetailColorChannel?: number;
    spriteSheet: string;
    sprites: SpriteJson[];
};

export class ObjectSprite {
    frameName: string;
    colorType: SpriteColorType;
    modelTransform: Mat3 = new Mat3();
    contentSize: Vec2 = new Vec2(0, 0);
    spriteOffset: Vec2 = new Vec2(0, 0);
    flipX: boolean = false;
    flipY: boolean = false;

    constructor(json: SpriteJson) {
        this.frameName = json.texture;

        switch (json.colorType) {
        default:
        case "base":   this.colorType = SpriteColorType.BASE; break;
        case "detail": this.colorType = SpriteColorType.DETAIL; break;
        case "black":  this.colorType = SpriteColorType.BLACK; break;
        case "glow":   this.colorType = SpriteColorType.GLOW; break;
        }

        let transform = new Mat3();

        // Idk why put position messes up object 1888:
        transform = transform.translate(new Vec2(...json.position));
        transform = transform.rotate(json.rotation * Math.PI / 180);
        transform = transform.scale(new Vec2(...json.scale));

        this.flipX = !!json.flipX;
        this.flipY = !!json.flipY;

        this.contentSize  = new Vec2(...json.contentSize);
        this.spriteOffset = new Vec2(...json.spriteOffset);

        this.modelTransform = transform;
    }
};

export class ObjectInfo {
    public defaultZOrder: number = 0;
    public defaultZLayer: ZLayer = ZLayer.B1;

    public defaultBaseColorChannel: number = 1;
    public defaultDetailColorChannel: number = 1;

    public spriteSheet: SpriteSheet = SpriteSheet.GAME_1;

    public sprites: ObjectSprite[] = [];

    static decodeSpriteSheet(spriteSheet: string): SpriteSheet {
        switch (spriteSheet) {
        default:
        case "game1":    return SpriteSheet.GAME_1;
        case "game2":    return SpriteSheet.GAME_2;
        case "text":     return SpriteSheet.TEXT;
        case "fire":     return SpriteSheet.FIRE;
        case "special":  return SpriteSheet.SPECIAL;
        case "glow":     return SpriteSheet.GLOW;
        case "pixel":    return SpriteSheet.PIXEL;
        case "unknown":  return SpriteSheet._UNK;
        case "particle": return SpriteSheet.PARTICLE;
        }
    }

    static lastSpriteId: number = 0;

    static fromJSON(json: ObjectJson): ObjectInfo {
        let obj = new ObjectInfo();

        obj.defaultZOrder = json.defaultZOrder || -2;
        obj.defaultZLayer = GameObject.getZLayerValue(json.defaultZLayer) ?? ZLayer.B1;

        obj.defaultBaseColorChannel   = json.defaultBaseColorChannel ?? 1011;
        obj.defaultDetailColorChannel = json.defaultDetailColorChannel ?? 0;

        obj.spriteSheet = this.decodeSpriteSheet(json.spriteSheet);

        for (const sprite of json.sprites)
            obj.sprites.push(new ObjectSprite(sprite));
        
        return obj;
    }

    static fromJSONList(list: {[id: string]: ObjectJson}) {
        let ret: {[id: number]: ObjectInfo} = {};

        for (let [k, v] of Object.entries(list)) {
            const id = +k;
            if (isNaN(id))
                continue;
            ret[id] = this.fromJSON(v);
        }

        return ret;
    }
}