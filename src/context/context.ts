import { Color } from '../util/color';
import { ObjectBatch } from '../render/object-batch';
import { Mat3 } from '../util/mat3';
import { GroupState } from '../groups';
import { HSVShift } from '../util/hsvshift';
import { Vec2 } from '../util/vec2';

export abstract class RenderContext {
    canvas: HTMLCanvasElement;

    abstract clearColor(c: Color);

    abstract compileObjects(c: ObjectBatch): any;

    abstract fillRect(pos: Vec2, size: Vec2, color: Color);
    
    abstract render(c: ObjectBatch);

    abstract loadTexture(img: HTMLImageElement): any;

    abstract setSize(width: number, height: number);
    
    abstract setViewMatrix(view: Mat3);

    abstract setGroupState(groupId: number, state: GroupState);

    abstract setObjectHSV(hsvId: number, hsv: HSVShift);
    
    abstract setColorChannel(channel: number, color: Color, blending: boolean);
}