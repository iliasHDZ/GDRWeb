export class SortedList<T> {
    array: T[];
    
    compareFn: (a: T, b: T) => number;
    
    constructor(compareFn: (a: T, b: T) => number) {
        this.array = [];

        this.compareFn = compareFn;
    }

    push(element: T): number {
        for (let i = 0; i < this.array.length; i++) {
            if (this.compareFn(element, this.array[i]) < 0) {
                this.array.splice(i, 0, element);
                return i;
            }
        }

        this.array.push(element);
        return this.array.length - 1;
    }

    remove(element: T): void {
        const idx = this.array.indexOf(element);
        if (idx == -1) return;

        this.array.splice(idx, 1);
    }

    at(index: number): T {
        return this.array[index];
    }
}