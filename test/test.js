// import acu from './levels/block_test';

import * as gdr from '../src/index';
import { GameObject } from '../src/object/object';

let canvas;

function randInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

window.onload = async () => {
    canvas = document.getElementById('canvas');

    /*
    await gdr.Renderer.initTextureInfo(
        "../assets/GJ_GameSheet-hd.plist",
        "../assets/GJ_GameSheet02-hd.plist"
    );
    */

    let renderer = new gdr.Renderer(
        new gdr.WebGLContext(canvas),
        "../assets/",
        gdr.TextureQuality.MEDIUM
    );

    await renderer.loadBackgrounds(name => `../assets/backgrounds/${name}.png`);
    await renderer.loadGrounds(name => `../assets/grounds/${name}.png`);

    /*const level = renderer.testSpeedPortalInsertion();
    if (!level)
        return;*/

    console.log('Loading level...');
    //const level = await GDLevel.parse(acu);

    const level = await gdr.Level.loadFromFile("levels/test.gmd");

    console.log('Loading complete...');
    
    renderer.camera.x = 0;

    document.getElementById('mainloader').style.display = 'none';

    console.log(level);

    let mx = 0;
    let my = 0;

    const render = () => {
        const pre = window.performance.now();
        renderer.render(level, { hideTriggers: false });
        const time = window.performance.now() - pre;

        const fps = Math.floor(1000 / time);
        const renderdur = time.toLocaleString('en-US', {maximumFractionDigits: 2});

        document.getElementById('fps').innerHTML = `FPS: ${fps} (Render duration: ${renderdur}ms)<br>`;
    }

    renderer.on('load', () => {
        render();
    });

    let drag = false;
    let shouldRender = false;

    document.onmousemove = (e) => {
        if (drag) {
            renderer.camera.x -= e.movementX / renderer.camera.zoom;
            renderer.camera.y += e.movementY / renderer.camera.zoom;

            shouldRender = true;
        }

        mx = e.clientX;
        my = e.clientY;

        const pos = renderer.camera.screenToWorldPos(new gdr.Vec2(mx, my));
        document.getElementById('mouse').innerHTML = `X: ${Math.floor(pos.x)}, Y: ${Math.floor(pos.y)}`;
    }

    const aupdate = () => {
        window.requestAnimationFrame(aupdate);

        if (shouldRender) {
            render();
            shouldRender = false;
        }
    }

    aupdate();

    canvas.oncontextmenu = () => false;

    canvas.onmousedown = (e) => {
        if (e.button == 2) {
            e.preventDefault();
            const pos = renderer.screenToWorldPos(new Vec2(e.offsetX, e.offsetY));

            for (let obj of level.data) {
                const dx = obj.x - pos.x;
                const dy = obj.y - pos.y;
                if (dx*dx + dy*dy < 40*40)
                    console.log(obj);
            }
        } else
            drag = true;
    }

    canvas.onwheel = (e) => {
        renderer.camera.zoom *= 1 - (e.deltaY / 1000);

        render();
    }

    document.onmouseup = () => {
        drag = false;
    }

    let playing = false;

    let audio = new Audio('songs/Epilogue.mp3');

    function play() {
        audio.currentTime = level.songOffset + level.timeAt(renderer.camera.x);
        playing = true;
        audio.volume = 0.5;
        audio.play();

        let lastTime = window.performance.now();
        let time = level.timeAt(renderer.camera.x);

        function pupdate() {
            if (playing)
                window.requestAnimationFrame(pupdate);

            const now = window.performance.now();
            time += (now - lastTime) / 1000;
            lastTime = now;

            let pos = level.posAt(time);

            renderer.camera.x = pos;
            shouldRender = true;
        }

        pupdate();
    }

    function stop() {
        playing = false;
        if (audio != null)
            audio.pause();
    }

    document.onkeydown = (e) => {
        if (e.code == "Space") {
            if (playing)
                stop();
            else
                play();
        } else if (e.code == "KeyO") {
            const objects = GameObject.generateRandomObjects(50);

            for (let obj of objects) {
                obj.x = renderer.camera.x + randInt(-200, 200);
                obj.y = renderer.camera.y + randInt(-200, 200);
            }

            level.insertObjects(objects);
            render();
        } else if (e.code == "KeyR") {
            const objects = level.getObjects();
            let rem = [];

            for (let obj of objects) {
                if (
                    obj.x > renderer.camera.x - 100 && obj.x < renderer.camera.x + 100 &&
                    obj.y > renderer.camera.y - 100 && obj.y < renderer.camera.y + 100
                ) {
                    rem.push(obj);
                }
            }

            level.removeObjects(rem);
            render();
        }
    }

    function resize() {
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        shouldRender = true;
    }

    window.onresize = resize;
    resize();
}