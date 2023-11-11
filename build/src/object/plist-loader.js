"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlistAtlasLoader = void 0;
const sprite_1 = require("../util/sprite");
const plist = __importStar(require("../ext/fast-plist"));
const vec2_1 = require("../util/vec2");
async function readFile(path) {
    let ret = await fetch(path);
    return await ret.text();
}
class PlistAtlasLoader {
    constructor() { }
    parseBracketFormat(str) {
        const list = str.replace(/{/g, '').replace(/}/g, '').split(',');
        let ret = [];
        for (let numstr of list) {
            const num = +numstr;
            if (isNaN(num))
                throw new Error("numbers expected in bracket format, got: " + str);
            ret.push(num);
        }
        return ret;
    }
    readTextureKey(obj, key1, key2, texname) {
        let ret;
        if (typeof (obj[key1]) == 'string' || typeof (obj[key1]) == 'boolean')
            ret = obj[key1];
        else if (typeof (obj[key2]) == 'string' || typeof (obj[key2]) == 'boolean')
            ret = obj[key2];
        else {
            throw new Error(`'${key1}' or '${key2}' is invalid in texture '${texname}'`);
        }
        return ret;
    }
    parseDimensions(obj, rotated, idx1, idx2) {
        if (obj.length <= Math.max(idx1, idx2))
            throw new Error("invalid dimensions");
        let width, height;
        if (rotated) {
            width = obj[idx2] + 2;
            height = obj[idx1] + 2;
        }
        else {
            width = obj[idx1] + 2;
            height = obj[idx2] + 2;
        }
        return [width, height];
    }
    parseTexture(name, obj) {
        if (typeof (obj) != 'object')
            return null;
        let crop;
        let size;
        let offset;
        let rotated;
        const codedCrop = this.parseBracketFormat('' + this.readTextureKey(obj, "frame", "textureRect", name));
        const codedSize = this.parseBracketFormat('' + this.readTextureKey(obj, "sourceSize", "spriteSourceSize", name));
        const codedOffset = this.parseBracketFormat('' + this.readTextureKey(obj, "offset", "spriteOffset", name));
        const rot = this.readTextureKey(obj, "rotated", "textureRotated", name);
        if (typeof (rot) != 'boolean')
            throw new Error(`'rotated' or 'textureRotated' is not a boolean in texture '${name}'`);
        rotated = rot;
        const [cropWidth, cropHeight] = this.parseDimensions(codedCrop, rotated, 2, 3);
        crop = new sprite_1.SpriteCrop(codedCrop[0] - 1, codedCrop[1] - 1, cropWidth, cropHeight);
        const [spriteWidth, spriteHeight] = this.parseDimensions(codedSize, rotated, 0, 1);
        size = new vec2_1.Vec2(spriteWidth, spriteHeight);
        offset = new vec2_1.Vec2(codedOffset[0], codedOffset[1]);
        return new sprite_1.SpriteCropInfo(name, crop, size, offset, rotated);
    }
    async load(path, sheetnum = 0) {
        this.data = plist.parse(await readFile(path));
        if (typeof (this.data.frames) != 'object')
            throw new Error("'frames' in plist is invalid");
        if (typeof (this.data.metadata) != 'object')
            throw new Error("'metadata' in plist is invalid");
        this.metadata = this.data.metadata;
        if (typeof (this.metadata.format) != 'number')
            throw new Error("'format' in metadata of plist is invalid");
        this.format = this.metadata.format;
        let ret = {};
        for (let [k, v] of Object.entries(this.data.frames)) {
            const sprite = this.parseTexture(k, v);
            sprite.sheet = sheetnum;
            if (sprite != null)
                ret[sprite.name] = sprite;
        }
        return ret;
    }
}
exports.PlistAtlasLoader = PlistAtlasLoader;
