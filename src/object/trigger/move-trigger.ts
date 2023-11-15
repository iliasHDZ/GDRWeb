import { EasingStyle, easingFunction } from "../../util/easing";
import { Vec2 } from "../../util/vec2";
import { GDObject } from "../object";
import { TriggerValue, ValueTrigger } from "./value-trigger";

export class MoveTriggerValue extends TriggerValue {
    public offset: Vec2;

    constructor(offset: Vec2) {
        super();
        this.offset = offset;
    }

    static default(): MoveTriggerValue {
        return new MoveTriggerValue(new Vec2(0, 0));
    }

    combineWith(value: TriggerValue): TriggerValue | null {
        if (!(value instanceof MoveTriggerValue))
            return null;

        return new MoveTriggerValue(this.offset.add(value.offset));
    }
}

export class MoveTrigger extends ValueTrigger {
    moveX: number;
    moveY: number;

    lockToPlayerX: boolean;
    lockToPlayerY: boolean;

    easing: EasingStyle;
    
    targetGroupId: number;

    duration: number;

    applyData(data: {}): void {
        super.applyData(data);

        this.moveX = GDObject.parse(data[28], 'number', 0);
        this.moveY = GDObject.parse(data[29], 'number', 0);

        this.lockToPlayerX = GDObject.parse(data[58], 'boolean', false);
        this.lockToPlayerY = GDObject.parse(data[59], 'boolean', false);

        this.easing = GDObject.parse(data[30], 'number', EasingStyle.NONE);

        this.targetGroupId = GDObject.parse(data[51], 'number', 0);

        this.duration = GDObject.parse(data[10], 'number', 0);
    }

    public valueAfterDelta(_: TriggerValue, deltaTime: number, startTime: number): TriggerValue {
        const time = deltaTime / this.duration;
        let offset = new Vec2(0, 0);
        
        if (time >= 1 || isNaN(time))
            offset = new Vec2(this.moveX, this.moveY);
        else {
            // TODO: Implement easing rate
            const easingOffset = easingFunction(time, this.easing);
            offset = new Vec2(easingOffset * this.moveX, easingOffset * this.moveY);
        }

        let startPos: number;
        let afterPos: number;
        if (this.lockToPlayerX || this.lockToPlayerY) {
            startPos = this.level.posAt(startTime);
            afterPos = this.level.posAt(startTime + deltaTime);
        }

        if (this.lockToPlayerX && this.level)
            offset.x = afterPos - startPos;

        if (this.lockToPlayerY && this.level)
            offset.y = this.level.gameStateAtPos(afterPos).approxYPos - this.level.gameStateAtPos(startPos).approxYPos;

        return new MoveTriggerValue(offset);
    }

    public getDuration(): number {
        return this.duration;
    }

    static isOfType(id: number): boolean {
        return id == 901;
    }
}