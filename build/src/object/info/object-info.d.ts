import { SpriteCropInfo } from "../../util/sprite";
import { ObjectSprite } from "./object-sprite";
export declare enum ZLayer {
    B4 = 0,
    B3 = 1,
    B2 = 2,
    B1 = 3,
    T1 = 4,
    T2 = 5,
    T3 = 6
}
export declare class GDObjectsInfo {
    atlas: {
        [key: string]: SpriteCropInfo;
    };
    data: {
        [id: number]: GDObjectInfo;
    };
    constructor(atlas: {
        [key: string]: SpriteCropInfo;
    }, data: {
        [id: number]: GDObjectInfo;
    });
    getData(id: number): GDObjectInfo;
}
export declare class GDObjectInfo {
    zorder: number;
    zlayer: ZLayer;
    baseCol: number;
    detailCol: number;
    rootSprite: ObjectSprite | null;
    static getDataZLayer(z: number, fromGD?: boolean): ZLayer;
    static lastSpriteId: number;
    static fromJSON(data: any, atlas: {
        [key: string]: SpriteCropInfo;
    }): GDObjectInfo;
    static fromJSONList(list: any, atlas: {
        [key: string]: SpriteCropInfo;
    }): {
        [id: number]: GDObjectInfo;
    };
}
