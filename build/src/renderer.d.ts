import { RenderContext } from './context/context';
import { Texture } from './render/texture';
import { GDObjectsInfo } from './object/info/object-info';
import { GDLevel } from './level';
import { Camera } from './camera';
import { Profile } from './profiler';
export declare class Renderer {
    ctx: RenderContext;
    sheet0: Texture;
    sheet2: Texture;
    camera: Camera;
    static objectInfo: GDObjectsInfo;
    handlers: {};
    constructor(ctx: RenderContext, sheetpath0: string, sheetpath2: string);
    static initTextureInfo(plistpath0: string, plistpath2: string): Promise<void>;
    init(sheetpath0: string, sheetpath2: string): Promise<void>;
    emit(event: string, ...args: any[]): void;
    on(event: string, handler: Function): void;
    render(level: GDLevel): Profile;
}
