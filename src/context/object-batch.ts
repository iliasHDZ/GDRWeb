import { Level } from "..";
import { GDObjectsInfo } from "../object/info/object-info";
import { GameObject } from "../object/object";
import { TextureObject } from "../render/texture-object";

export interface ObjectBatch {
    setRenderInfo(info: GDObjectsInfo): void;

    insert(object: GameObject): void;

    insertMultiple(object: GameObject[]): void;

    remove(object: GameObject): void;

    removeMultiple(object: GameObject[]): void;

    update(object: GameObject): void;
};

export class ObjectBatchInstance {
    public object: GameObject;
    public address: number;
    public size: number;

    constructor(object: GameObject, size: number, address: number = 0) {
        this.object  = object;
        this.address = address;
        this.size    = size;
    }

    nextAddress(): number {
        return this.address + this.size;
    }

    equals(ins: ObjectBatchInstance): boolean {
        return (
            this.object == ins.object &&
            this.size == ins.size
        );
    }
};

export abstract class BatchBuffer {
    public bufferSize: number;

    public pointer: number;

    constructor(size: number) {
        this.bufferSize = size;
        this.pointer = 0;
    }

    abstract write(address: number, textures: TextureObject[]): void;

    abstract copyTo(dstBuffer: BatchBuffer, dst: number, src: number, size: number): void;
    
    public seekRelative(change: number) {
        this.pointer += change;
    }

    public ptrWrite(textures: TextureObject[]): void {
        this.write(this.pointer, textures);
        this.pointer += textures.length;
    }

    public ptrCopyTo(dstBuffer: BatchBuffer, size: number): void {
        this.copyTo(dstBuffer, dstBuffer.pointer, this.pointer, size);
        dstBuffer.pointer += size;
        this.pointer += size;
    }
}

export class TestBatchBuffer extends BatchBuffer {
    buffer: TextureObject[];

    constructor(size: number) {
        super(size);
        this.buffer = [];
        for (let i = 0; i < size; i++)
            this.buffer.push(null);
    }

    write(address: number, textures: TextureObject[]): void {
        if (address + textures.length > this.bufferSize) {
            console.error("Writing goes out of buffer bounds");
            return;
        }

        for (let i = 0; i < textures.length; i++)
            this.buffer[address + i] = textures[i];
    }

    copyTo(dstBuffer: BatchBuffer, dst: number, src: number, size: number): void {
        if (!(dstBuffer instanceof TestBatchBuffer))  {
            console.error("Copy: Destination buffer is not instance of TestBatchBuffer");
            return;
        }

        if (dst + size > dstBuffer.bufferSize) {
            console.error("Writing goes out of buffer bounds");
            return;
        }

        if (src + size > this.bufferSize) {
            console.error("Reading goes out of buffer bounds");
            return;
        }

        for (let i = 0; i < size; i++) {
            dstBuffer.buffer[dst + i] = this.buffer[src + i];
        }
    }
};

export abstract class BufferedObjectBatch implements ObjectBatch {
    renderInfo: GDObjectsInfo;

    instances: ObjectBatchInstance[];

    buffer: BatchBuffer | null = null;

    level: Level;

    constructor(level: Level) {
        this.level = level;
        this.instances = [];
    }

    abstract createBuffer(size: number): BatchBuffer;

    abstract destroyBuffer(buffer: BatchBuffer): void;

    getAddressAtIndex(index: number) {
        return index == 0 ? 0 : this.instances[index - 1].nextAddress();
    }

    getSizeOfInstances(insArray: ObjectBatchInstance[]): number {
        let res = 0;
        for (let ins of insArray)
            res += ins.size;

        return res;
    }

    correctAddressesSinceIndex(index: number, address?: number) {
        let addr = address ?? this.getAddressAtIndex(index);

        for (; index < this.instances.length; index++) {
            this.instances[index].address = addr;
            addr += this.instances[index].size;
        }
    }

    generateTexturesOfInstances(instances: ObjectBatchInstance[]): TextureObject[] {
        let res: TextureObject[] = [];
        for (let ins of instances) {
            res = res.concat(ins.object.generateBatchObjects(this.level, this.renderInfo));
        }

        return res;
    }

    insertInstances(newInsArray: ObjectBatchInstance[]) {
        const oldInsArray = this.instances;

        let address = 0;
        let secReadFrom: 'old' | 'new' | null = null;

        let texObjArray: TextureObject[] = [];
        let texSize: number = 0;

        let oldInsIdx = 0;
        let newInsIdx = 0;

        const newBufferSize = (this.buffer?.bufferSize ?? 0) + this.getSizeOfInstances(newInsArray);

        let resArray: ObjectBatchInstance[] = [];
        
        const oldBuffer = this.buffer;
        const newBuffer = this.createBuffer(newBufferSize);

        if (oldBuffer)
            oldBuffer.pointer = 0;
        newBuffer.pointer = 0;

        while (oldInsIdx < oldInsArray.length || newInsIdx < newInsArray.length) {
            const oldIns = oldInsArray[oldInsIdx];
            const newIns = newInsArray[newInsIdx];

            let ins: ObjectBatchInstance;
            let readFrom: 'old' | 'new' | null = null;

            let isOld = false;
            if (oldIns && newIns)
                isOld = GameObject.compareZOrder(oldIns.object, newIns.object) <= 0;
            else if (oldIns)
                isOld = true;

            if (isOld) {
                oldInsIdx++;
                ins = oldIns;
                readFrom = 'old';
            } else {
                newInsIdx++;
                ins = newIns;
                readFrom = 'new';
            }

            ins.address = address;
            resArray.push(ins);

            if (secReadFrom != null && secReadFrom != readFrom) {
                if (oldBuffer && secReadFrom == 'old')
                    oldBuffer.ptrCopyTo(newBuffer, texSize);
                else
                    newBuffer.ptrWrite(texObjArray);
                
                texObjArray = [];
                texSize = 0;
            }
            secReadFrom = readFrom;

            if (!oldBuffer || secReadFrom != 'old')
                texObjArray = texObjArray.concat(ins.object.generateBatchObjects(this.level, this.renderInfo));

            texSize += ins.size;
            address += ins.size;
        }

        if (secReadFrom != null) {
            if (oldBuffer && secReadFrom == 'old')
                oldBuffer.ptrCopyTo(newBuffer, texSize);
            else
                newBuffer.ptrWrite(texObjArray);
        }

        if (oldBuffer)
            this.destroyBuffer(oldBuffer);

        this.instances = resArray;
        this.buffer = newBuffer;
    }

    removeInstances(objects: GameObject[]) {
        if (!this.buffer)
            return;

        const oldInsArray = this.instances;

        let address = 0;
        let texSize = 0;

        let remInsArray: ObjectBatchInstance[] = [];

        for (let ins of oldInsArray) {
            if (objects.includes(ins.object))
                remInsArray.push(ins);
        }

        const newBufferSize = this.buffer.bufferSize - this.getSizeOfInstances(remInsArray);

        let resArray: ObjectBatchInstance[] = [];
        
        const oldBuffer = this.buffer;
        const newBuffer = this.createBuffer(newBufferSize);

        oldBuffer.pointer = 0;
        newBuffer.pointer = 0;

        for (let ins of oldInsArray) {
            if (remInsArray.includes(ins)) {
                if (texSize != 0) {
                    oldBuffer.ptrCopyTo(newBuffer, texSize);
                }

                oldBuffer.seekRelative(ins.size);
                texSize = 0;
            } else {
                ins.address = address;
                resArray.push(ins);

                texSize += ins.size;
                address += ins.size;
            }
        }
        
        if (texSize != 0) {
            oldBuffer.ptrCopyTo(newBuffer, texSize);
        }

        this.destroyBuffer(oldBuffer);

        this.instances = resArray;
        this.buffer = newBuffer;
    }

    setRenderInfo(info: GDObjectsInfo) {
        this.renderInfo = info;
    }
    
    insert(object: GameObject) {
        const size = object.batchObjectCount(this.renderInfo);
        if (size <= 0)
            return;

        this.insertInstances([new ObjectBatchInstance(object, object.batchObjectCount(this.renderInfo))]);
    }
    
    insertMultiple(objects: GameObject[]) {
        if (!GameObject.areObjectsSortedByZOrder(objects))
            GameObject.sortObjectsByZOrder(objects);

        let insArray: ObjectBatchInstance[] = [];
        for (let obj of objects) {
            const size = obj.batchObjectCount(this.renderInfo);
            if (size <= 0)
                continue;

            insArray.push(new ObjectBatchInstance(obj, size));
        }

        this.insertInstances(insArray);
    }
    
    remove(object: GameObject) {
        this.removeInstances([object]);
    }
    
    removeMultiple(objects: GameObject[]) {
        this.removeInstances(objects);
    }

    update(object: GameObject) {
        let ins: ObjectBatchInstance | null = null;
        for (let inss of this.instances) {
            if (inss.object == object) {
                ins = inss;
                break;
            }
        }

        if (ins == null) return;

        this.buffer.pointer = ins.address;
        this.buffer.ptrWrite(ins.object.generateBatchObjects(this.level, this.renderInfo));
    }
};

export class TestBufferedObjectBatch extends BufferedObjectBatch {
    createBuffer(size: number): BatchBuffer {
        return new TestBatchBuffer(size);
    }

    destroyBuffer(buffer: BatchBuffer): void {
        console.log("Buffer destroyed!");
    }

    isValid(): boolean {
        let objs: GameObject[] = [];
        for (let ins of this.instances)
            objs.push(ins.object);

        if (!GameObject.areObjectsSortedByZOrder(objs)) {
            console.log("✖ Instances are correctly sorted");
            return false;
        }

        console.log("✔ Instances are correctly sorted");

        let address = 0;
        for (let ins of this.instances) {
            if (ins.address != address) {
                console.log("✖ Instances addresses are correctly set");
                return false;
            }

            address += ins.size;
        }

        console.log("✔ Instances addresses are correctly set");
        return true;
    }

    static haveSameResults(a: TestBufferedObjectBatch, b: TestBufferedObjectBatch): boolean {
        console.log("Testing validity of A:");
        if (!a.isValid()) return false;
        console.log("Testing validity of B:");
        if (!b.isValid()) return false;

        const insArrayA = a.instances.slice();
        const insArrayB = b.instances.slice();

        const bufferA = a.buffer;
        const bufferB = b.buffer;
        if (!(bufferA instanceof TestBatchBuffer) || !(bufferB instanceof TestBatchBuffer))
            return false;

        for (let o of bufferA.buffer)
            if (o == null) {
                console.log("✖ Buffer A is completely filled");
                return false;
            }
        console.log("✔ Buffer A is completely filled");

        for (let o of bufferB.buffer)
            if (o == null) {
                console.log("✖ Buffer B is completely filled");
                return false;
            }
        console.log("✔ Buffer B is completely filled");

        while (insArrayA.length > 0) {
            const insA = insArrayA[0];
            
            let insIdxB = 0;
            let insB: ObjectBatchInstance | null = null;
            for (; insIdxB < insArrayB.length; insIdxB++) {
                if (insA.equals(insArrayB[insIdxB])) {
                    insB = insArrayB[insIdxB];
                    break;
                }
            }

            if (insB == null) {
                console.log("✖ A contains an instance that B does not contain:");
                console.log(insA);
                return false;
            }

            for (let i = 0; i < insA.size; i++) {
                const texAIdx = insA.address + i;
                const texBIdx = insB.address + i;

                const texA = bufferA.buffer[texAIdx];
                const texB = bufferB.buffer[texBIdx];

                if (!texA.sameAs(texB)) {
                    console.log("✖ Instance in A and instance in B have different texture objects:");
                    console.log("Texture object in A at " + texAIdx);
                    console.log(texA);
                    console.log("Texture object in B at " + texBIdx);
                    console.log(texB);
                    return false;
                }
            }

            insArrayA.splice(0, 1)
            insArrayB.splice(insIdxB, 1);
        }
        console.log("✔ Tests succeded");

        return true;
    }

    printLayering() {
        let str = "";
        for (let ins of this.instances) {
            str += `id: ${ins.object.id}, zl: ${ins.object.zlayer}, zo: ${ins.object.zorder}\n`;
        }
        console.log(str);
    }
}