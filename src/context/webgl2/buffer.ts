export class BufferObject {
    gl: WebGL2RenderingContext;

    vbo: WebGLBuffer;

    public size = 0;

    constructor(gl: WebGL2RenderingContext, data: ArrayBuffer) {
        this.gl = gl;

        this.vbo = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    }
}