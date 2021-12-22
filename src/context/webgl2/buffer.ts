export class BufferObject {
    gl: WebGL2RenderingContext;

    vbo: WebGLBuffer;

    public size = 0;

    constructor(gl: WebGL2RenderingContext, data: number[]) {
        this.gl = gl;

        this.vbo = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    }
}