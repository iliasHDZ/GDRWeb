import {Vec2} from './vec2';

export class Mat3 {
    public d: Float32Array;

    constructor() {
        this.d = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    }

    static from(m: Mat3): Mat3 {
        let r = new Mat3();

        for (let i = 0; i < 9; i++)
            r.d[i] = m.d[i];

        return r;
    }

    translate(v: Vec2) {
        let d = this.d, x = v.x, y = v.y;
        let a00 = d[0],
            a01 = d[1],
            a02 = d[2],
            a10 = d[3],
            a11 = d[4],
            a12 = d[5],
            a20 = d[6],
            a21 = d[7],
            a22 = d[8];
    
        d[0] = a00;
        d[1] = a01;
        d[2] = a02;
        
        d[3] = a10;
        d[4] = a11;
        d[5] = a12;
        
        d[6] = x * a00 + y * a10 + a20;
        d[7] = x * a01 + y * a11 + a21;
        d[8] = x * a02 + y * a12 + a22;

        this.d = d;
    }

    scale(v: Vec2) {
        let d = this.d, x = v.x, y = v.y;

        d[0] *= x;
        d[1] *= x;
        d[2] *= x;

        d[3] *= y;
        d[4] *= y;
        d[5] *= y;

        this.d = d;
    }

    rotate(r: number) {
        let d = this.d, c = Math.cos(r), s = Math.sin(r);
        
        let a00 = d[0],
            a01 = d[1],
            a02 = d[2],
            a10 = d[3],
            a11 = d[4],
            a12 = d[5];

        d[0] = c * a00 + s * a10;
        d[1] = c * a01 + s * a11;
        d[2] = c * a02 + s * a12;

        d[3] = c * a10 - s * a00;
        d[4] = c * a11 - s * a01;
        d[5] = c * a12 - s * a02;

        this.d = d;
    }

    transform(v: Vec2): Vec2 {
        let d = this.d, x = v.x, y = v.y;

        v.x = d[0] * x + d[3] * y + d[6];
        v.y = d[1] * x + d[4] * y + d[7];

        return v;
    }

    multiply(mat: Mat3): Mat3 {
        const a = this.d;
        const b = mat.d;
        let out = new Mat3();

        const a00 = a[0], a01 = a[1], a02 = a[2];
        const a10 = a[3], a11 = a[4], a12 = a[5];
        const a20 = a[6], a21 = a[7], a22 = a[8];

        const b00 = b[0], b01 = b[1], b02 = b[2];
        const b10 = b[3], b11 = b[4], b12 = b[5];
        const b20 = b[6], b21 = b[7], b22 = b[8];

        out.d[0] = b00 * a00 + b01 * a10 + b02 * a20;
        out.d[1] = b00 * a01 + b01 * a11 + b02 * a21;
        out.d[2] = b00 * a02 + b01 * a12 + b02 * a22;

        out.d[3] = b10 * a00 + b11 * a10 + b12 * a20;
        out.d[4] = b10 * a01 + b11 * a11 + b12 * a21;
        out.d[5] = b10 * a02 + b11 * a12 + b12 * a22;

        out.d[6] = b20 * a00 + b21 * a10 + b22 * a20;
        out.d[7] = b20 * a01 + b21 * a11 + b22 * a21;
        out.d[8] = b20 * a02 + b21 * a12 + b22 * a22;
        return out;
    }

    buffer() {
        return this.d;
    }
}