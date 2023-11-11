export namespace Util {
    export function lerp(v1: number, v2: number, a: number): number {
        return (1 - a) * v1 + a * v2;
    }

    export function clamp(val: number, min: number, max: number): number {
        return Math.min(max, Math.max(min, val));
    }
}