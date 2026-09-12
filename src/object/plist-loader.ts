import { SpriteCrop, SpriteFrame } from "../util/sprite";
import * as plist from "../ext/fast-plist";
import { Vec2 } from "../util/vec2";

async function readFile(path: string) {
    let ret = await fetch(path);
    return await ret.text();
}

export class PlistAtlasLoader {
    data: any;
    metadata: any;
    format: number = 0;
    
    constructor() {}

    private parseBracketFormat(str: string): number[] {
        const list = str.replace(/{/g, '').replace(/}/g, '').split(',');
        let ret: number[] = [];

        for (let numstr of list) {
            const num = +numstr;
            if (isNaN(num))
                throw new Error("numbers expected in bracket format, got: " + str);

            ret.push(num);
        }

        return ret;
    }

    private readTextureKey(obj: any, key1: string, key2: string, texname: string): string | boolean {
        let ret: string | boolean;

        if (typeof(obj[key1]) == 'string' || typeof(obj[key1]) == 'boolean')
            ret = obj[key1];
        else if (typeof(obj[key2]) == 'string' || typeof(obj[key2]) == 'boolean')
            ret = obj[key2];
        else {
            throw new Error(`'${key1}' or '${key2}' is invalid in texture '${texname}'`);
        }

        return ret;
    }

    private parseDimensions(obj: number[], rotated: boolean, idx1: number, idx2: number): [number, number] {
        if (obj.length <= Math.max(idx1, idx2))
            throw new Error("invalid dimensions");

        let width: number, height: number;
        if (rotated) {
            // width  = obj[idx2] + 2;
            // height = obj[idx1] + 2;
            width  = obj[idx2];
            height = obj[idx1];
        } else {
            // width  = obj[idx1] + 2;
            // height = obj[idx2] + 2;
            width  = obj[idx2];
            height = obj[idx1];
        }

        return [width, height]
    }

    private parseTexture(name: string, obj: any): SpriteFrame | null {
        // absolute's texturepacker (i think) has a bug that adds '.' and '..' as textures
        if (name == '.' || name == '..')
            return null;

        if (typeof(obj) != 'object')
            return null;

        let crop: SpriteCrop;
        let originalSize: Vec2;
        let offset: Vec2;
        let rotated: boolean;

        const codedCrop   = this.parseBracketFormat( '' + this.readTextureKey(obj, "frame", "textureRect", name) );
        const codedSize   = this.parseBracketFormat( '' + this.readTextureKey(obj, "sourceSize", "spriteSourceSize", name) );
        const codedOffset = this.parseBracketFormat( '' + this.readTextureKey(obj, "offset", "spriteOffset", name) );
        
        const rot = this.readTextureKey(obj, "rotated", "textureRotated", name);
        if (typeof(rot) != 'boolean')
            throw new Error(`'rotated' or 'textureRotated' is not a boolean in texture '${name}'`);
        rotated = rot;

        crop = new SpriteCrop(codedCrop[0], codedCrop[1], codedCrop[2], codedCrop[3]);
        originalSize = new Vec2(codedSize[0], codedSize[1]);
        offset = new Vec2(codedOffset[0], codedOffset[1]);

        return new SpriteFrame(name, crop, originalSize, offset, rotated);
    }

    async load(path: string, sheetnum = 0): Promise<{ [key: string]: SpriteFrame }> {
        this.data = plist.parse(await readFile(path));
        
        if (typeof(this.data.frames) != 'object')
            throw new Error("'frames' in plist is invalid");
        
        if (typeof(this.data.metadata) != 'object')
            throw new Error("'metadata' in plist is invalid");

        this.metadata = this.data.metadata;

        if (typeof(this.metadata.format) != 'number')
            throw new Error("'format' in metadata of plist is invalid")

        this.format = this.metadata.format;

        let ret: {[key: string]: SpriteFrame} = {};

        for (let [k, v] of Object.entries(this.data.frames)) {
            const sprite: SpriteFrame | null = this.parseTexture(k, v);
            if (sprite == null)
                continue;

            sprite.sheet = sheetnum;

            if (sprite != null)
                ret[sprite.name] = sprite;
        }

        return ret;
    }
}