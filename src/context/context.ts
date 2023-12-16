import { Color } from '../util/color';
import { ObjectBatch } from './object-batch';
import { Mat3 } from '../util/mat3';
import { GroupState } from '../group-manager';
import { HSVShift } from '../util/hsvshift';
import { Vec2 } from '../util/vec2';
import { Profiler } from '../profiler';
import { GroupTransform } from '../transform/group-transform';
import { Level } from '../level';

export class ContextRenderOptions {
    public hideTriggers: boolean = false;
};

export abstract class RenderContext {
    canvas: HTMLCanvasElement;

    abstract setProfiler(profiler: Profiler);

    abstract clearColor(c: Color);

    abstract loadTexture(img: HTMLImageElement): any;

    abstract setSize(width: number, height: number);
    
    abstract setViewMatrix(view: Mat3);

    abstract setGroupState(groupId: number, state: GroupState);

    abstract setGroupTransform(transformId: number, state: GroupTransform);

    abstract setObjectHSV(hsvId: number, hsv: HSVShift);
    
    abstract setColorChannel(channel: number, color: Color, blending: boolean);

    // abstract compileObjects(c: ObjectBatch): any;

    abstract createObjectBatch(level: Level): ObjectBatch;

    abstract fillRect(pos: Vec2, size: Vec2, color: Color);

    abstract renderTexture(pos: Vec2, size: Vec2, texture: any, color: Color);
    
    abstract render(c: ObjectBatch, options: ContextRenderOptions | null, mainTexture: any, secondTexture: any);
}