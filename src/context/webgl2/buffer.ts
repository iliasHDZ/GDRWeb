export class BufferObject {
    gl: WebGL2RenderingContext;

    vbo: WebGLBuffer;

    public size = 0;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;

        this.vbo = gl.createBuffer();
    }

    writeFull(data: ArrayBuffer, mutable: boolean = false) {
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, data, mutable ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
    }

    write(data: ArrayBuffer, offset: number) {
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferSubData(gl.ARRAY_BUFFER, offset, data);
    }

    allocate(size: number, mutable: boolean = false) {
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, size, mutable ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
    }

    static copy(src: BufferObject, dst: BufferObject, srcOffset: number, dstOffset: number, size: number) {
        const gl = src.gl;

        gl.bindBuffer(gl.COPY_READ_BUFFER,  src.vbo);
        gl.bindBuffer(gl.COPY_WRITE_BUFFER, dst.vbo);
        gl.copyBufferSubData(
            gl.COPY_READ_BUFFER,
            gl.COPY_WRITE_BUFFER,
            srcOffset,
            dstOffset,
            size
        );
    }

    static createEmpty(gl: WebGL2RenderingContext, size: number, mutable: boolean = false) {
        const ret = new BufferObject(gl);
        ret.allocate(size, mutable);
        return ret;
    }

    static fromData(gl: WebGL2RenderingContext, data: ArrayBuffer): BufferObject {
        const ret = new BufferObject(gl);
        ret.writeFull(data);
        return ret;
    }

    destroy() {
        const gl = this.gl;

        gl.deleteBuffer(this.vbo);
    }
}