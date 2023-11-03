import { Color } from '../util/color';
import { ObjectBatch } from '../render/object-batch';
import { Mat3 } from '../util/mat3';

export abstract class RenderContext {
    canvas: HTMLCanvasElement;

    abstract clearColor(c: Color);

    abstract compileObjects(c: ObjectBatch): any;
    
    abstract render(c: ObjectBatch);

    abstract loadTexture(img: HTMLImageElement): any;
    
    abstract setViewMatrix(view: Mat3);
    
    abstract setColorChannel(channel: number, color: Color, blending: boolean);
}