import { Mat3 } from "./util/mat3";
import { Vec2 } from "./util/vec2";

export class Camera {
    x: number;
    y: number;

    zoom: number;

    screenSize: Vec2 = new Vec2(0, 0);

    constructor(x: number, y: number, zoom: number) {
        this.x = x;
        this.y = y;

        this.zoom = zoom;
    }

    setScreenSize(width: number, height: number) {
        this.screenSize = new Vec2(width, height);
    }

    screenToWorldPos(pos: Vec2): Vec2 {
        const x = ( pos.x - (this.screenSize.x / 2)  ) / this.zoom + this.x;
        const y = ( (this.screenSize.y / 2) - pos.y ) / this.zoom + this.y;

        return new Vec2(x, y);
    }

    getCameraWorldSize(): Vec2 {
        return this.screenSize.div(new Vec2(this.zoom, this.zoom));
    }

    getMatrix(): Mat3 {
        let m = new Mat3();

        const width  = this.screenSize.x;
        const height = this.screenSize.y;

        m.scale( new Vec2( 2 / width * this.zoom, 2 / height * this.zoom ) );
        m.translate( new Vec2(-this.x, -this.y) );

        return m;
    }
}