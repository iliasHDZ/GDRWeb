import { Color } from '../util/color';
import { ObjectCollection } from '../render/object-collection';
import { Mat3 } from '../util/mat3';

export abstract class RenderContext {
    canvas: HTMLCanvasElement;

    abstract clearColor(c: Color);

    abstract compileObjects(c: ObjectCollection): any;
    
    abstract render(c: ObjectCollection);

    abstract loadTexture(img: HTMLImageElement): any;
    
    abstract setViewMatrix(view: Mat3);
    
    abstract setColorChannel(channel: number, color: Color);
}