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

    buffer() {
        return this.d;
    }
}