import {Vec2} from './vec2';

export class Mat3 {
    public readonly d: Readonly<Float32Array>;

    constructor(d: Float32Array = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])) {
        this.d = d;
    }

    static from(m: Mat3): Mat3 {
        let r = new Float32Array(9);

        for (let i = 0; i < 9; i++)
            r[i] = m.d[i];

        return new Mat3(r);
    }

    equals(m: Mat3): boolean {
        return (
            this.d[0] == m.d[0] &&
            this.d[1] == m.d[1] &&
            this.d[2] == m.d[2] &&
            this.d[3] == m.d[3] &&
            this.d[4] == m.d[4] &&
            this.d[5] == m.d[5] &&
            this.d[6] == m.d[6] &&
            this.d[7] == m.d[7] &&
            this.d[8] == m.d[8]
        );
    }

    translate(v: Vec2): Mat3 {
        let d = this.d.slice(), x = v.x, y = v.y;
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

        return new Mat3(d);
    }

    scale(v: Vec2) {
        let d = this.d.slice(), x = v.x, y = v.y;

        d[0] *= x;
        d[1] *= x;
        // d[2] *= x;

        d[3] *= y;
        d[4] *= y;
        // d[5] *= y;

        return new Mat3(d);
    }

    rotate(r: number) {
        let d = this.d.slice(), c = Math.cos(r), s = Math.sin(r);
        
        let a00 = d[0],
            a01 = d[1],
            a02 = d[2],
            a10 = d[3],
            a11 = d[4],
            a12 = d[5];

        d[0] = c * a00 + s * a10;
        d[1] = c * a01 + s * a11;
        // d[2] = c * a02 + s * a12;

        d[3] = c * a10 - s * a00;
        d[4] = c * a11 - s * a01;
        // d[5] = c * a12 - s * a02;

        return new Mat3(d);
    }

    rotateXY(rX: number, rY: number) {
        let d = this.d.slice();
        let cX = Math.cos(rX), sX = Math.sin(rX);
        let cY = Math.cos(rY), sY = Math.sin(rY);
        
        let a00 = d[0],
            a01 = d[1],
            a02 = d[2],
            a10 = d[3],
            a11 = d[4],
            a12 = d[5];

        d[0] = cX * a00 + sX * a10;
        d[1] = cX * a01 + sX * a11;
        // d[2] = c * a02 + s * a12;

        d[3] = cY * a10 - sY * a00;
        d[4] = cY * a11 - sY * a01;
        // d[5] = c * a12 - s * a02;

        return new Mat3(d);
    }

    transform(v: Vec2): Vec2 {
        const d = this.d, x = v.x, y = v.y;

        return new Vec2(
            d[0] * x + d[3] * y + d[6],
            d[1] * x + d[4] * y + d[7]
        )
    }

    static multiplyMatrices(...matrices: Mat3[]): Mat3 {
        let res: Mat3 = matrices[0];
        for (let i = 1; i < matrices.length; i++)
            res = res.multiply(matrices[i]);

        return res;
    }

    multiply(mat: Mat3): Mat3 {
        const a = this.d;
        const b = mat.d;
        let out = new Float32Array(9);

        const a00 = a[0], a01 = a[1], a02 = a[2];
        const a10 = a[3], a11 = a[4], a12 = a[5];
        const a20 = a[6], a21 = a[7], a22 = a[8];

        const b00 = b[0], b01 = b[1], b02 = b[2];
        const b10 = b[3], b11 = b[4], b12 = b[5];
        const b20 = b[6], b21 = b[7], b22 = b[8];

        out[0] = b00 * a00 + b01 * a10 + b02 * a20;
        out[1] = b00 * a01 + b01 * a11 + b02 * a21;
        out[2] = b00 * a02 + b01 * a12 + b02 * a22;

        out[3] = b10 * a00 + b11 * a10 + b12 * a20;
        out[4] = b10 * a01 + b11 * a11 + b12 * a21;
        out[5] = b10 * a02 + b11 * a12 + b12 * a22;

        out[6] = b20 * a00 + b21 * a10 + b22 * a20;
        out[7] = b20 * a01 + b21 * a11 + b22 * a21;
        out[8] = b20 * a02 + b21 * a12 + b22 * a22;
        return new Mat3(out);
    }

    buffer() {
        return this.d;
    }
}