import { Trigger } from "./trigger";
export declare class StopTrigger extends Trigger {
    targetGroupId: number;
    applyData(data: {}): void;
    static isOfType(id: number): boolean;
}
