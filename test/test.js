import acu from './levels/acu';

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
    await gdr.Renderer.initTextureInfo(
        "../assets/GJ_GameSheet-hd.plist",
        "../assets/GJ_GameSheet02-hd.plist"
    );

    let renderer = new gdr.Renderer(
        new gdr.WebGLContext(canvas),
        "../assets/GJ_GameSheet-hd.png",
        "../assets/GJ_GameSheet02-hd.png"
    );

    console.log(renderer.testBatchRemoval());

    await renderer.loadBackgrounds(name => `../assets/backgrounds/${name}.png`);
    await renderer.loadGrounds(name => `../assets/grounds/${name}.png`);

    /*const level = renderer.testSpeedPortalInsertion();
    if (!level)
        return;*/

    console.log('Loading level...');
    //const level = await GDLevel.parse(acu);

    const level = await gdr.Level.loadFromFile("levels/White_Space.gmd");

    console.log('Loading complete...');
    
    renderer.camera.x = 0;

    document.getElementById('mainloader').style.display = 'none';

    console.log(level);

    let mx = 0;
    let my = 0;

    const render = () => {
        renderer.render(level, { hideTriggers: true });

        /*const fps = Math.floor(1000 / profile.duration);
        const renderdur = profile.duration.toLocaleString('en-US', {maximumFractionDigits: 2});

        document.getElementById('fps').innerHTML = `FPS: ${fps} (Render duration: ${renderdur}ms)<br>`;

        const profileElem = document.getElementById('profile');
        profileElem.innerHTML = "";

        profileElem.appendChild(profile.toHTMLElement());*/
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
        audio.currentTime = level.song_offset + level.timeAt(renderer.camera.x);
        playing = true;
        audio.volume = 0.5;
        audio.play();

        function pupdate() {
            if (playing)
                window.requestAnimationFrame(pupdate);

            let pos = level.posAt(audio.currentTime - level.song_offset);

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
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        shouldRender = true;
    }

    window.onresize = resize;
    resize();
}