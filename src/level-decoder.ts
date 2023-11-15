import Pako from "pako";
import { parse } from "./ext/fast-plist";

export type LevelFileExtension = "lvl" | "gmd" | "gmd2" | "auto";

export class LevelDecoder {
    public levelString: string = "";

    constructor() {}

    decodeBase64Level(data: string) {
        data = data.replaceAll("-", "+");
        data = data.replaceAll("_", "/");

        /*const idx = data.lastIndexOf(' ');
        if (idx != -1)
            data = data.substring(0, idx);*/

        let array = Uint8Array.from(atob(data), c => c.charCodeAt(0));

        try {
            array = Pako.inflate(array);
        } catch (err) {
            throw new Error("Error decoding level file: Failed to decompress");
        }

        this.levelString = new TextDecoder().decode(array);
    }

    decodeGMDFormat(data: ArrayBuffer) {
        const decoder = new TextDecoder();
        let pliststr = decoder.decode(data);

        pliststr = pliststr.replaceAll("<d>", "<dict>");
        pliststr = pliststr.replaceAll("<k>", "<key>");
        pliststr = pliststr.replaceAll("<i>", "<integer>");
        pliststr = pliststr.replaceAll("<s>", "<string>");
        pliststr = pliststr.replaceAll("</d>", "</dict>");
        pliststr = pliststr.replaceAll("</k>", "</key>");
        pliststr = pliststr.replaceAll("</i>", "</integer>");
        pliststr = pliststr.replaceAll("</s>", "</string>");
        pliststr = pliststr.replaceAll("<t", "<true");
        pliststr = pliststr.replaceAll("<f", "<false");

        console.log(pliststr);

        const plist = parse(pliststr);

        if (typeof(plist['k4']) != "string")
            throw new Error("Error decoding level file: 'k4' is not a string");

        this.decodeBase64Level(plist['k4']);
    }

    decodeLVLFormat(data: ArrayBuffer) {
        let array: Uint8Array;
        try {
            array = Pako.inflate(data);
        } catch (err) {
            throw new Error("Error decoding level file: Failed to decompress");
        }

        const str = new TextDecoder().decode(array);

        this.decodeGMDFormat(new TextEncoder().encode("<d>" + str + "</d>"));
    }

    decodeGMD2Format(_: ArrayBuffer) {
        throw new Error("Error: .gmd2 format has not yet been implemented, please use .gmd or .lvl formats instead");
    }

    static detectFileExtension(data: ArrayBuffer): LevelFileExtension | null {
        const array = new Uint8Array(data);

        if (array[0] == 0x1f && array[1] == 0x8b)
            return "lvl";

        if (array[0] == 0x50 && array[1] == 0x4b)
            return "gmd2";

        if (array[0] == ('<').codePointAt(0))
            return "gmd";

        return null;
    }

    decode(data: ArrayBuffer, extension: LevelFileExtension = "auto") {
        let ext: LevelFileExtension | null = extension;

        if (ext == "auto")
            ext = LevelDecoder.detectFileExtension(data);

        if (ext == null)
            throw new Error("Error decoding level file: Could not detect level format");

        switch (ext) {
        case "gmd":
            this.decodeGMDFormat(data);
            break;
        case "lvl":
            this.decodeLVLFormat(data);
            break;
        case "gmd2":
            this.decodeGMD2Format(data);
            break;
        }
    }

    async decodeFromFile(path: string, extension: LevelFileExtension = "auto") {
        let data: ArrayBuffer;
        try {
            const res = await fetch(path);
            data = await res.arrayBuffer();
        } catch (err) {
            if (err instanceof Error)
                throw new Error(`Error fetching file '${path}': ${err.message}`);
            else
                throw new Error(`Error fetching file '${path}'`);
        }

        return this.decode(data, extension);
    }
}