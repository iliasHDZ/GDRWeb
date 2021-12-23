import { Mat3 } from "./util/mat3";
import { Vec2 } from "./util/vec2";

export class Camera {
    x: number;
    y: number;

    zoom: number;

    constructor(x: number, y: number, zoom: number) {
        this.x = x;
        this.y = y;

        this.zoom = zoom;
    }

    getMatrix(width: number, height: number): Mat3 {
        let m = new Mat3();

        m.scale( new Vec2( 2 / width * this.zoom, 2 / height * this.zoom ) );
        m.translate( new Vec2(-this.x, -this.y) );

        return m;
    }
}