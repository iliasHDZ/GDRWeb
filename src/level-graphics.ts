import { GDLevel, Renderer } from ".";
import { ObjectBatch } from "./context/object-batch";
import { GameObject } from "./object/object";

export class LevelGraphics {
    public level: GDLevel;
    public renderer: Renderer;

    mainBatch: ObjectBatch;

    constructor(level: GDLevel, renderer: Renderer) {
        this.level = level;
        this.renderer = renderer;

        this.mainBatch = renderer.createObjectBatch(level);
    }

    insertObject(object: GameObject) {
        this.mainBatch.insert(object);
    }

    insertObjects(objects: GameObject[]) {
        this.mainBatch.insertMultiple(objects);
    }

    removeObject(object: GameObject) {
        this.mainBatch.remove(object);
    }

    removeObjects(objects: GameObject[]) {
        this.mainBatch.removeMultiple(objects);
    }
};