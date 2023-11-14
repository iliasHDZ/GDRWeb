import acu from './levels/acu';

import {Renderer, GDLevel, WebGLContext, Vec2} from '../src/index';

window.onload = () => {
    let canvas = document.getElementById('canvas');

    (async () => {
        await Renderer.initTextureInfo(
            "../assets/GJ_GameSheet-hd.plist",
            "../assets/GJ_GameSheet02-hd.plist"
        );

        let renderer = new Renderer(
            new WebGLContext(canvas),
            "../assets/GJ_GameSheet-hd.png",
            "../assets/GJ_GameSheet02-hd.png"
        );

        renderer.camera.x = 0;

        console.log('Loading level...');
        let level = await GDLevel.loadFromFile("levels/Acu.gmd", renderer);
        console.log('Loading complete...');

        console.log(level);

        let mx = 0;
        let my = 0;

        const render = () => {
            const profile = renderer.render(level);

            const fps = Math.floor(1000 / profile.duration);
            const renderdur = profile.duration.toLocaleString('en-US', {maximumFractionDigits: 2});

            document.getElementById('fps').innerHTML = `FPS: ${fps} (Render duration: ${renderdur}ms)<br>`;

            /*const profileElem = document.getElementById('profile');
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

            const pos = renderer.camera.screenToWorldPos(new Vec2(mx, my));
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
            }
        }

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            shouldRender = true;
        }

        window.onresize = resize;
        resize();
    })();

    //renderer.render(level);
}