export class SortedList<T> {
    _array: T[];
    
    compareFn: (a: T, b: T) => number;
    
    constructor(compareFn: (a: T, b: T) => number) {
        this._array = [];

        this.compareFn = compareFn;
    }

    get array(): readonly T[] {
        return this._array;
    }

    get length(): number {
        return this._array.length;
    }

    push(element: T): number {
        for (let i = 0; i < this._array.length; i++) {
            if (this.compareFn(element, this._array[i]) < 0) {
                this._array.splice(i, 0, element);
                return i;
            }
        }

        this._array.push(element);
        return this._array.length - 1;
    }

    removeIndex(index: number): void {
        this._array.splice(index, 1);
    }

    remove(element: T): void {
        const index = this._array.indexOf(element);
        if (index == -1) return;

        this.removeIndex(index);
    }

    at(index: number): T {
        return this._array[index];
    }
}