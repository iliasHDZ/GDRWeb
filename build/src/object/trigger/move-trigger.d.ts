import { EasingStyle } from "../../util/easing";
import { Vec2 } from "../../util/vec2";
import { TriggerValue, ValueTrigger } from "./value-trigger";
export declare class MoveTriggerValue extends TriggerValue {
    offset: Vec2;
    constructor(offset: Vec2);
}
export declare class MoveTrigger extends ValueTrigger {
    moveX: number;
    moveY: number;
    lockToPlayerX: boolean;
    lockToPlayerY: boolean;
    easing: EasingStyle;
    targetGroupId: number;
    duration: number;
    applyData(data: {}): void;
    shouldUseDeltaPos(): boolean;
    valueAfterDeltaPos(startValue: TriggerValue, deltaPos: number): TriggerValue;
    valueAfterDelta(startValue: TriggerValue, deltaTime: number): TriggerValue;
    getDuration(): number;
    static isOfType(id: number): boolean;
}
