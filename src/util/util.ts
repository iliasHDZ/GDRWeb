export namespace Util {
    export function lerp(v1: number, v2: number, a: number): number {
        return (1 - a) * v1 + a * v2;
    }

    export function clamp(val: number, min: number, max: number): number {
        return Math.min(max, Math.max(min, val));
    }

    export function largestValueSmallerThan<T>(max: number, array: T[], valueFunc: (o: T) => number, start = 0, end = -1): T | null {
        if (end == -1)
            end = array.length;

        if (end - start == 1)
            return array[start];

        if (end == start)
            return null;

        const pivot = Math.floor((start + end) / 2);

        if (valueFunc(array[pivot]) < max)
            return largestValueSmallerThan(max, array, valueFunc, pivot, end);
        else
            return largestValueSmallerThan(max, array, valueFunc, start, pivot - 1);
    }
}