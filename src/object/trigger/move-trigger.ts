import { EasingStyle, easingFunction } from "../../util/easing";
import { Util } from "../../util/util";
import { Vec2 } from "../../util/vec2";
import { GDObject } from "../object";
import { TriggerValue, ValueTrigger } from "./value-trigger";

export class MoveTriggerValue extends TriggerValue {
    public offset: Vec2;

    constructor(offset: Vec2) {
        super();
        this.offset = offset;
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

        this.lockToPlayerX = GDObject.parse(data[58], 'boolean', 0);
        this.lockToPlayerY = GDObject.parse(data[59], 'boolean', 0);

        this.easing = GDObject.parse(data[30], 'number', EasingStyle.NONE);

        this.targetGroupId = GDObject.parse(data[51], 'number', 0);

        this.duration = GDObject.parse(data[10], 'number', 0);
    }

    public shouldUseDeltaPos(): boolean {
        return this.lockToPlayerX;
    }

    public valueAfterDeltaPos(startValue: TriggerValue, deltaPos: number): TriggerValue {
        let startOffset = new Vec2(0, 0);
        if (startValue instanceof MoveTriggerValue)
            startOffset = startValue.offset;

        let offset = new Vec2(deltaPos, 0);

        return new MoveTriggerValue(startOffset.add(offset));
    }

    public valueAfterDelta(startValue: TriggerValue, deltaTime: number): TriggerValue {
        let startOffset = new Vec2(0, 0);
        if (startValue instanceof MoveTriggerValue)
            startOffset = startValue.offset;

        const time = deltaTime / this.duration;
        let offset = new Vec2(0, 0);
        
        if (isNaN(time) || time >= 1)
            offset = new Vec2(this.moveX, this.moveY);
        else {
            // TODO: Implement easing rate
            const easingOffset = easingFunction(time, this.easing);
            offset = new Vec2(easingOffset * this.moveX, easingOffset * this.moveY);
        }

        return new MoveTriggerValue(startOffset.add(offset));
    }

    public getDuration(): number {
        return this.duration;
    }

    static isOfType(id: number): boolean {
        return id == 901;
    }
}