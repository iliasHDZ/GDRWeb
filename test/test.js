let {GDRWebRenderer, WebGLContext} = require('../build/main');

window.onload = () => {
    let canvas = document.getElementById('canvas');
    
    let renderer = new GDRWebRenderer(
        new WebGLContext(canvas)
    );

    canvas.onmousemove = (e) => {
        renderer.render();
    }

    renderer.render();
}