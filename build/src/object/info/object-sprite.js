"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectSprite = exports.ObjectSpriteColor = void 0;
const vec2_1 = require("../../util/vec2");
const mat3_1 = require("../../util/mat3");
var ObjectSpriteColor;
(function (ObjectSpriteColor) {
    ObjectSpriteColor[ObjectSpriteColor["BASE"] = 0] = "BASE";
    ObjectSpriteColor[ObjectSpriteColor["DETAIL"] = 1] = "DETAIL";
    ObjectSpriteColor[ObjectSpriteColor["BLACK"] = 2] = "BLACK";
})(ObjectSpriteColor = exports.ObjectSpriteColor || (exports.ObjectSpriteColor = {}));
function ObjectSpriteColorFromString(str) {
    switch (str) {
        case "Base": return ObjectSpriteColor.BASE;
        case "Detail": return ObjectSpriteColor.DETAIL;
        case "Black": return ObjectSpriteColor.BLACK;
    }
}
class ObjectSprite {
    constructor(sprite) {
        this.position = new vec2_1.Vec2(0, 0);
        this.size = new vec2_1.Vec2(0, 0);
        this.scale = new vec2_1.Vec2(1, 1);
        this.rotation = 0;
        this.anchor = new vec2_1.Vec2(0, 0);
        this.prevPosition = new vec2_1.Vec2(0, 0);
        this.prevSize = new vec2_1.Vec2(0, 0);
        this.prevScale = new vec2_1.Vec2(1, 1);
        this.prevRotation = 0;
        this.prevAnchor = new vec2_1.Vec2(0, 0);
        this.children = [];
        this.parent = null;
        this.modelMatrix = null;
        this.renderModelMatrix = null;
        this.colorType = ObjectSpriteColor.BASE;
        this.depth = 0;
        this.sprite = sprite;
    }
    static fromJSON(obj, atlas) {
        if (obj == null)
            return null;
        const spriteInfo = atlas[obj.texture];
        if (spriteInfo == null)
            return null;
        const sprite = new ObjectSprite(spriteInfo);
        sprite.position = new vec2_1.Vec2(obj.x ?? 0, obj.y ?? 0);
        sprite.size = spriteInfo.crop.getSize().spritePixelsToUnits(62);
        sprite.scale = new vec2_1.Vec2(obj.scale_x ?? 1, obj.scale_y ?? 1);
        sprite.rotation = obj.rot ?? 0;
        sprite.anchor = new vec2_1.Vec2(obj.anchor_x ?? 0, obj.anchor_y ?? 0);
        sprite.depth = obj.z ?? 0;
        if (spriteInfo.rotated) {
            const swap = sprite.size.y;
            sprite.size.y = -sprite.size.x;
            sprite.size.x = swap;
        }
        if (obj.flip_x)
            sprite.scale.x *= -1;
        if (obj.flip_y)
            sprite.scale.y *= -1;
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
    enumerateAll(func) {
        func(this);
        for (const child of this.children)
            child.enumerateAll(func);
    }
    enumerateAllByDepth(func) {
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
    addChild(node) {
        node.parent = this;
        let i = 0;
        for (; i < this.children.length; i++) {
            if (node.depth <= this.children[i].depth)
                break;
        }
        this.children.splice(i, 0, node);
    }
    calcModelMatrix() {
        let positionMatrix = new mat3_1.Mat3();
        let sizeMatrix = new mat3_1.Mat3();
        let scaleMatrix = new mat3_1.Mat3();
        let rotationMatrix = new mat3_1.Mat3();
        let spriteOffsetMatrix = new mat3_1.Mat3();
        let anchorMatrix = new mat3_1.Mat3();
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
        if (this.modelMatrix != null &&
            this.position.equals(this.prevPosition) &&
            this.size.equals(this.prevSize) &&
            this.scale.equals(this.prevScale) &&
            this.rotation == this.prevRotation &&
            this.anchor.equals(this.prevAnchor)) {
            return;
        }
        [this.modelMatrix, this.renderModelMatrix] = this.calcModelMatrix();
        this.prevPosition = this.position;
        this.prevSize = this.size;
        this.prevScale = this.scale;
        this.prevRotation = this.rotation;
        this.prevAnchor = this.anchor;
    }
    getModelMatrix() {
        this.updateModelMatrix();
        return this.modelMatrix;
    }
    getRenderModelMatrix() {
        this.updateModelMatrix();
        return this.renderModelMatrix;
    }
}
exports.ObjectSprite = ObjectSprite;
;
