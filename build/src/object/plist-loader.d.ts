import { SpriteCropInfo } from "../util/sprite";
export declare class PlistAtlasLoader {
    data: any;
    metadata: any;
    format: number;
    constructor();
    private parseBracketFormat;
    private readTextureKey;
    private parseDimensions;
    private parseTexture;
    load(path: string, sheetnum?: number): Promise<{
        [key: string]: SpriteCropInfo;
    }>;
}
