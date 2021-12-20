# GDRWeb
A Geometry Dash Level Rendering Engine

## What's GDRWeb
It is a work-in-progress rendering engine for rendering Geometry Dash levels on web-based applications. The engine is written in Typescript and currently only supports WebGL 2.0. However, rendering contexts are easily expandable.

## How to build this?
GDRWeb can easily be built using an already available node script. First you want to install all dependencies.
```
npm i
```
> Prepare for your hard drive to be flooded!

After that you can build it by executing the following node script:
```
npm run build
```
The built file will be available at `build/main.js`. It will use a commonjs module system so i recommend using [browserify](https://github.com/browserify/browserify) to be able to `require()` that file.

If you don't know what I mean. Well, there is a simple example at [test/test.js](test/test.js). This can also be built using `npm run buildntest` (well it actually builds both the engine and the test). It just simply runs the command `browserify test/test.js > test/bundle.js`.

Also, never forget to test in a http server. This can easily be turned on in this repo using `npm run server`. And with that you can go `localhost:8000/test` to run the test (after you built the test of course).