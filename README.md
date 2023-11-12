# GDRWeb
A Geometry Dash Level Rendering Engine for the web.

## What is GDRWeb?
It is a work-in-progress rendering engine for rendering Geometry Dash levels on web-based applications. The engine is written in Typescript and currently only supports WebGL 2.0. However, rendering contexts are easily expandable. GDRWeb has the following features:

- Color Trigger Support
- Alpha Trigger Support
- Pulse Trigger Support
- Move Trigger Support
- Toggle Trigger Support
- Stop Trigger Support
- Object HSV Shifting
- Copy Colors

The engine is also pretty fast as it uses batch rendering and currently renders everything in one draw call. It is also random access meaning that you can go anywhere in a level and the renderer will automatically recalculate all trigger states for you.

![Acu in GDRWeb](https://raw.githubusercontent.com/iliasHDZ/GDRWeb/main/acu.png)

## How to use GDRWeb?
GDRWeb is easy to include into your Javascript project. You need to install the GDRWeb NPM package into your project. After that, you can require GDRWeb in a Javascript file and use it like this:

```js
const {Renderer, GDLevel, WebGLContext} = require('gdrweb');

window.onload = () => {
    // Getting the canvas. You can create the canvas in any
    // way you want.
    let canvas = document.getElementById('canvas');

    (async () => {
        // Loading all the texture plists. These can be found
        // in the /Resources folder in the Geometry Dash game
        // directory. Put them in your project folder and
        // and give the path as an argument in this function:
        await Renderer.initTextureInfo(
            "GJ_GameSheet-hd.plist",
            "GJ_GameSheet02-hd.plist"
        );

        // Creating the renderer using a WebGL context. You also
        // have to specify the path to the game sheets. These
        // can also be found in the /Resources folder
        let renderer = new Renderer(
            new WebGLContext(canvas),
            "GJ_GameSheet-hd.png",
            "GJ_GameSheet02-hd.png"
        );

        // Set the camera position
        renderer.camera.x = 0;

        // Here, you create the level using the raw
        // level string
        const levelString = "...";
        let level = GDLevel.parse(renderer, levelString);

        // When the renderer is loaded, render the level
        renderer.on('load', () => {
            renderer.render(level);
        });
    })();
}
```

This won't work like that on your browser. Rather this has to
be bundled using a web bundler. This should work with any web
bundler out of the box.

Following web bundlers have been tested: [browserify](https://github.com/browserify/browserify) and [webpack](https://webpack.js.org/).

After bundling, the bundled Javascript file can be included in a HTML file and then you can test it out by opening the HTML file using a http-server. Or, you could disable CORS and just open the HTML file just like that. Though, that is not advisable.