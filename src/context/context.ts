import { Color } from '../util/color';
import { ObjectCollection } from '../render/object-collection';

export abstract class RenderContext {
    abstract clearColor(c: Color);

    abstract compileObjects(c: ObjectCollection): any;
    
    abstract render(c: ObjectCollection);
}