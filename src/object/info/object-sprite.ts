import { Vec2 } from "../../util/vec2"
import { Mat3 } from "../../util/mat3"
import { SpriteCropInfo } from "../../util/sprite";

export enum ObjectSpriteColor {
    BASE,
    DETAIL,
    BLACK
}

function ObjectSpriteColorFromString(str: string): ObjectSpriteColor {
    switch (str) {
    case "Base":   return ObjectSpriteColor.BASE;
    case "Detail": return ObjectSpriteColor.DETAIL;
    case "Black":  return ObjectSpriteColor.BLACK;
    }
}

export class ObjectSprite {
    position: Vec2 = new Vec2(0, 0);
    size: Vec2 = new Vec2(0, 0);
    scale: Vec2 = new Vec2(1, 1);
    rotation: number = 0;
    anchor: Vec2 = new Vec2(0, 0);

    prevPosition: Vec2 = new Vec2(0, 0);
    prevSize: Vec2 = new Vec2(0, 0);
    prevScale: Vec2 = new Vec2(1, 1);
    prevRotation: number = 0;
    prevAnchor: Vec2 = new Vec2(0, 0);

    children: ObjectSprite[] = [];
    parent: ObjectSprite | null = null;

    modelMatrix: Mat3 | null = null;
    renderModelMatrix: Mat3 | null = null;

    colorType: ObjectSpriteColor = ObjectSpriteColor.BASE;
    sprite: SpriteCropInfo;
    depth: number = 0;

    constructor(sprite: SpriteCropInfo) {
        this.sprite = sprite;
    }

    static fromJSON(obj: any, atlas: {[key: string]: SpriteCropInfo}): ObjectSprite | null {
        if (obj == null)
            return null;

        const spriteInfo = atlas[obj.texture];
        if (spriteInfo == null)
            return null;

        const sprite = new ObjectSprite(spriteInfo);

        sprite.position = new Vec2(obj.x ?? 0, obj.y ?? 0);
        sprite.size     = spriteInfo.crop.getSize().spritePixelsToUnits(62);
        sprite.scale    = new Vec2(obj.scale_x ?? 1, obj.scale_y ?? 1);
        sprite.rotation = obj.rot ?? 0;
        sprite.anchor   = new Vec2(obj.anchor_x ?? 0, obj.anchor_y ?? 0);
        sprite.depth    = obj.z ?? 0;

        if (spriteInfo.rotated) {
            const swap = sprite.size.y;
            sprite.size.y = -sprite.size.x;
            sprite.size.x = swap;
        }

        if (obj.flip_x) sprite.scale.x *= -1;
        if (obj.flip_y) sprite.scale.y *= -1;

        sprite.colorType = ObjectSpriteColorFromString(obj.color_type);

        if (Array.isArray(obj.children))
            for (let child of obj.children) {
                if (!child.texture)
                    continue;

                const childSprite = ObjectSprite.fromJSON(child, atlas);
                if (childSprite != null)
                    sprite.addChild(childSprite);
            }

        return sprite;
    }

    enumerateAll(func: (node: ObjectSprite) => void) {
        func(this);
        for (const child of this.children)
            child.enumerateAll(func);
    }

    enumerateAllByDepth(func: (node: ObjectSprite) => void) {
        let i = 0;
        for (; i < this.children.length; i++) {
            if (this.children[i].depth >= 0)
                break;
            
            this.children[i].enumerateAllByDepth(func);
        }

        func(this);

        for (; i < this.children.length; i++)
            this.children[i].enumerateAllByDepth(func);
    }

    addChild(node: ObjectSprite) {
        node.parent = this;

        let i = 0;
        for (; i < this.children.length; i++) {
            if (node.depth <= this.children[i].depth)
                break;
        
        }

        this.children.splice(i, 0, node);
    }

    calcModelMatrix(): [Mat3, Mat3] {
        let positionMatrix = new Mat3();
        let sizeMatrix = new Mat3();
        let scaleMatrix = new Mat3();
        let rotationMatrix = new Mat3();
        let spriteOffsetMatrix = new Mat3();
        let anchorMatrix = new Mat3();

        // Idk why put position messes up object 1888:
        positionMatrix.translate(this.position);
        anchorMatrix.translate(this.anchor.mul(this.size).neg());
        sizeMatrix.scale(this.size);
        scaleMatrix.scale(this.scale);
        rotationMatrix.rotate(this.rotation * Math.PI / 180);
        spriteOffsetMatrix.translate(this.sprite.offset.spritePixelsToUnits(62));

        let modelMatrix = positionMatrix.multiply(rotationMatrix).multiply(scaleMatrix);
        let renderModelMatrix = modelMatrix.multiply(anchorMatrix.multiply(spriteOffsetMatrix.multiply(sizeMatrix)));

        if (this.parent != null) {
            const parentMatrix = this.parent.getModelMatrix();

            modelMatrix = parentMatrix.multiply(modelMatrix);
            renderModelMatrix = parentMatrix.multiply(renderModelMatrix);
        }

        return [modelMatrix, renderModelMatrix];
    }

    updateModelMatrix() {
        if (
            this.modelMatrix != null &&
            this.position.equals(this.prevPosition) &&
            this.size.equals(this.prevSize) &&
            this.scale.equals(this.prevScale) &&
            this.rotation == this.prevRotation &&
            this.anchor.equals(this.prevAnchor)
        ) {
            return;
        }

        [this.modelMatrix, this.renderModelMatrix] = this.calcModelMatrix();

        this.prevPosition = this.position;
        this.prevSize = this.size;
        this.prevScale = this.scale;
        this.prevRotation = this.rotation;
        this.prevAnchor = this.anchor;
    }

    getModelMatrix(): Mat3 {
        this.updateModelMatrix();
        return this.modelMatrix as Mat3;
    }

    getRenderModelMatrix(): Mat3 {
        this.updateModelMatrix();
        return this.renderModelMatrix as Mat3;
    }
};