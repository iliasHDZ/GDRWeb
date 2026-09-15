import { TriggerSimulator } from "../../trigger-simulator";
import { ObjectPropertyReader } from "../object";
import { Trigger, TriggerAction } from "./trigger";

export type GroupRemap = { [id: number]: number };

function assignGroupRemap(dst: GroupRemap, src: GroupRemap): GroupRemap {
    const ret: GroupRemap = {};
    for (const [k, v] of Object.entries(dst))
        ret[+k] = v;
    for (const [k, v] of Object.entries(src))
        ret[+k] = v;
    return ret;
}

export class SpawnTrigger extends Trigger {
    targetGroupId: number = 0;

    delay: number = 0;
    delayPlusMinus: number = 0;
    
    spawnOrdered: boolean = false;
    resetRemap: boolean = false;

    groupRemap: GroupRemap = {};

    applyProperties(rd: ObjectPropertyReader): void {
        super.applyProperties(rd);

        this.targetGroupId = rd.number(51, 0);

        this.delay          = rd.number(63, 0);
        this.delayPlusMinus = rd.number(556, 0);

        this.spawnOrdered = rd.bool(441, false);
        this.resetRemap   = rd.bool(581, false);

        const remapList  = rd.intArray(442);
        const remapCount = Math.floor(remapList.length / 2);

        this.groupRemap = {};

        for (let i = 0; i < remapCount; i++)
            this.groupRemap[remapList[i * 2]] = remapList[i * 2 + 1];
    }

    public override getDuration(): number {
        return this.delay;
    }

    static isOfType(id: number): boolean {
        return id == 1268;
    }

    public onFinishAction(simulator: TriggerSimulator, action: TriggerAction) {
        const singleTriggers = (simulator.spawnableTriggersByGroupId[this.targetGroupId] ?? []).slice();
        const multiTriggers  = simulator.multiSpawnableTriggersByGroupId[this.targetGroupId] ?? [];

        if (singleTriggers.length == 0 && multiTriggers.length == 0)
            return;

        let remap = action.groupRemap;

        if (Object.keys(this.groupRemap).length > 0)
            remap = assignGroupRemap(action.groupRemap, this.groupRemap);

        if (!this.spawnOrdered) {
            for (const trigger of singleTriggers)
                simulator.spawnTrigger(trigger, action.endTime, remap);

            for (const trigger of multiTriggers)
                simulator.spawnTrigger(trigger, action.endTime, remap);
        } else {
            let triggers: Trigger[] = [...singleTriggers, ...multiTriggers];
            triggers.sort((a, b) => a.x - b.x);

            const startTime = simulator.level.timeAt(triggers[0].x);

            // FIXME: After the spawn ordered trigger's delay has finished,
            //        the execution of further triggers can still be prevented
            //        if the spawn trigger has been stopped using a stop trigger.
            //        It can also be paused and resumed. This isn't the case with
            //        the current code.

            for (const trigger of triggers) {
                const time = simulator.level.timeAt(trigger.x);
                simulator.spawnTrigger(trigger, time - startTime + action.endTime, remap);
            }
        }
    }
};