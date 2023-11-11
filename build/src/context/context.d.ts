import { Color } from '../util/color';
import { ObjectBatch } from '../render/object-batch';
import { Mat3 } from '../util/mat3';
import { GroupState } from '../groups';
import { HSVShift } from '../util/hsvshift';
import { Vec2 } from '../util/vec2';
export declare abstract class RenderContext {
    canvas: HTMLCanvasElement;
    abstract clearColor(c: Color): any;
    abstract compileObjects(c: ObjectBatch): any;
    abstract fillRect(pos: Vec2, size: Vec2, color: Color): any;
    abstract render(c: ObjectBatch): any;
    abstract loadTexture(img: HTMLImageElement): any;
    abstract setSize(width: number, height: number): any;
    abstract setViewMatrix(view: Mat3): any;
    abstract setGroupState(groupId: number, state: GroupState): any;
    abstract setObjectHSV(hsvId: number, hsv: HSVShift): any;
    abstract setColorChannel(channel: number, color: Color, blending: boolean): any;
}
