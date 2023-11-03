import { TriggerValue, ValueTrigger } from "./object/trigger/value-trigger";

class ValueTriggerExecution {
    time: number;
    trigger: ValueTrigger;

    constructor(trigger: ValueTrigger, time: number) {
        this.trigger = trigger;
        this.time    = time;
    }
}

export class ValueTriggerTrack {
    public executions: ValueTriggerExecution[];
    public startValue: TriggerValue;

    constructor(startValue: TriggerValue) {
        this.startValue = startValue;
        this.executions = [];
    }

    public setStartValue(value: TriggerValue) {
        this.startValue = value;
    }

    public insertTrigger(trigger: ValueTrigger, time: number) {
        const exec = new ValueTriggerExecution(trigger, time);

        for (let i = 0; i < this.executions.length; i++) {
            if (this.executions[i].time > time) {
                this.executions.splice(i, 0, exec);
                return;
            }
        }

        this.executions.push(exec);
    }

    public valueAt(time: number) {
        let value: TriggerValue = this.startValue;
        let lastExec: ValueTriggerExecution = null;

        for (let exec of this.executions) {
            if (exec.time >= time) break;

            if (lastExec)
                value = lastExec.trigger.valueAfterDelta(value, exec.time - lastExec.time);

            lastExec = exec;
        }

        if (lastExec)
            return lastExec.trigger.valueAfterDelta(value, time - lastExec.time);
        
        return value;
    }
}