let {Renderer, GDLevel, WebGLContext, Vec2} = require('..');

const acu = require('./levels/acu');

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

        const levelString = "kS38,1_40_2_125_3_255_11_255_12_255_13_255_6_1000_7_1_15_1_18_0_8_1|1_0_2_102_3_255_11_255_12_255_13_255_6_1001_7_1_15_1_18_0_8_1|1_0_2_102_3_255_11_255_12_255_13_255_4_-1_6_1009_7_1_15_1_18_0_8_1|1_255_2_255_3_255_11_255_12_255_13_255_6_1002_5_1_7_1_15_1_18_0_8_1|1_255_2_255_3_255_11_255_12_255_13_255_6_1004_7_1_15_1_18_0_8_1|1_125_2_255_3_0_11_255_12_255_13_255_4_-1_6_1005_5_1_7_1_15_1_18_0_8_1|1_0_2_255_3_255_11_255_12_255_13_255_4_-1_6_1006_5_1_7_1_15_1_18_0_8_1|,kA13,0,kA15,0,kA16,0,kA14,,kA6,0,kA7,0,kA17,0,kA18,0,kS39,0,kA2,0,kA3,0,kA8,0,kA4,0,kA9,0,kA10,0,kA11,0;1,1,2,285,3,15;1,1,2,315,3,15;1,1,2,345,3,15;1,1,2,435,3,15;1,1,2,465,3,15;1,1,2,495,3,15;1,1,2,525,3,15;1,8,2,555,3,15;1,1,2,585,3,15;1,8,2,615,3,15;1,8,2,645,3,15;1,1,2,675,3,15;1,1,2,705,3,15;1,1,2,735,3,15;1,1,2,765,3,15;1,35,2,825,3,2;1,35,2,915,3,2;1,35,2,1005,3,2;1,35,2,1215,3,2;1,35,2,1305,3,2;1,35,2,1425,3,2;1,36,2,1515,3,15;1,1,2,1785,3,15;1,1,2,1815,3,15;1,1,2,1845,3,15;1,1,2,2955,3,15;1,1,2,2985,3,15;1,1,2,3015,3,15;1,1,2,3045,3,15;1,1,2,3075,3,15;1,1,2,3105,3,15;1,1,2,3135,3,15;1,1,2,3165,3,15;1,8,2,3195,3,15;1,8,2,3225,3,15;1,8,2,3255,3,15;1,1,2,3285,3,15;1,1,2,3315,3,15;1,1,2,3345,3,15;1,8,2,3465,3,15;1,8,2,3615,3,15;1,35,2,3735,3,2;1,1,2,3855,3,15;1,1,2,3885,3,15;1,1,2,3915,3,15;1,1,2,3945,3,15;1,8,2,3975,3,15;1,8,2,4005,3,15;1,8,2,4035,3,15;1,1,2,4065,3,15;1,39,2,4095,3,6;1,39,2,4125,3,6;1,39,2,4155,3,6;1,1,2,4185,3,15;1,1,2,4335,3,15;1,1,2,4365,3,15;1,1,2,4395,3,15;1,1,2,4425,3,15;1,8,2,4455,3,15;1,8,2,4485,3,15;1,8,2,4515,3,15;1,8,2,4545,3,15;1,1,2,4575,3,15;1,1,2,4605,3,15;1,1,2,4635,3,15;1,1,2,4875,3,15;1,8,2,4905,3,15;1,8,2,4935,3,15;1,8,2,4965,3,15;1,1,2,4995,3,15;1,1,2,5025,3,15;1,1,2,5055,3,15;1,1,2,5085,3,15;1,1,2,5115,3,15;1,1,2,5145,3,15;1,1,2,5175,3,15;1,8,2,5355,3,15;1,8,2,5385,3,15;1,8,2,5565,3,15;1,8,2,5595,3,15;1,13,2,5715,3,45,13,0;1,1,2,5865,3,405;1,1,2,5865,3,375;1,1,2,5865,3,345;1,1,2,5865,3,315;1,1,2,5865,3,285;1,1,2,5865,3,255;1,1,2,5865,3,225;1,1,2,5895,3,15;1,1,2,5895,3,45;1,1,2,5895,3,75;1,1,2,6045,3,15;1,1,2,6075,3,45;1,1,2,6075,3,345;1,1,2,6105,3,75;1,1,2,6135,3,105;1,1,2,6165,3,135;1,1,2,6195,3,135;1,1,2,6105,3,315;1,1,2,6105,3,285;1,1,2,6135,3,285;1,1,2,6135,3,255;1,1,2,6165,3,255;1,1,2,6195,3,255;1,1,2,6225,3,135;1,1,2,6225,3,255;1,1,2,6255,3,255;1,1,2,6255,3,105;1,1,2,6285,3,105;1,1,2,6285,3,285;1,1,2,6315,3,105;1,1,2,6315,3,315;1,1,2,6345,3,315;1,1,2,6375,3,315;1,1,2,6345,3,105;1,1,2,6375,3,105;1,1,2,6435,3,315;1,1,2,6405,3,315;1,1,2,6465,3,315;1,1,2,6405,3,105;1,1,2,6435,3,105;1,1,2,6465,3,105;1,1,2,6495,3,285;1,1,2,6495,3,135;1,1,2,6525,3,255;1,1,2,6555,3,255;1,1,2,6585,3,255;1,1,2,6525,3,135;1,1,2,6555,3,135;1,1,2,6585,3,135;1,1,2,6615,3,255;1,1,2,6615,3,135;1,1,2,6645,3,255;1,1,2,6645,3,135;1,1,2,6675,3,255;1,1,2,6675,3,135;1,1,2,6705,3,255;1,1,2,6735,3,255;1,1,2,6765,3,255;1,1,2,6705,3,135;1,1,2,6735,3,135;1,1,2,6765,3,135;1,1,2,6795,3,255;1,1,2,6795,3,135;1,1,2,6825,3,255;1,1,2,6855,3,255;1,1,2,6825,3,135;1,1,2,6855,3,135;1,12,2,6825,3,195;1,1,2,7065,3,15;1,1,2,7095,3,15;1,1,2,7125,3,15;1,1,2,7155,3,15;1,1,2,7185,3,15;1,1,2,7215,3,15;1,1,2,7245,3,15;1,1,2,7275,3,15;1,1,2,7305,3,15;1,1,2,7335,3,15;1,8,2,7365,3,15;1,8,2,7395,3,15;1,8,2,7425,3,15;1,1,2,7455,3,15;1,1,2,7485,3,15;1,1,2,7515,3,15;1,1,2,7545,3,15;1,1,2,7575,3,15;1,8,2,7605,3,15;1,8,2,7635,3,15;1,1,2,7665,3,15;1,1,2,7695,3,15;1,1,2,7725,3,15;1,1,2,7905,3,15;1,1,2,7935,3,15;1,1,2,7965,3,15;1,8,2,7995,3,15;1,8,2,8025,3,15;1,1,2,8055,3,15;1,1,2,8085,3,15;1,35,2,8205,3,2;1,35,2,8325,3,2;1,35,2,8445,3,2;1,35,2,8565,3,2;1,35,2,8685,3,2;1,35,2,8805,3,2;1,35,2,8925,3,2;1,35,2,9045,3,2;1,1,2,9255,3,15;1,1,2,9285,3,15;1,1,2,9315,3,15;1,1,2,9345,3,15;1,1,2,9375,3,15;1,1,2,9405,3,15;1,1,2,9435,3,15;1,8,2,9465,3,15;1,8,2,9495,3,15;1,8,2,9525,3,15;1,1,2,9555,3,15;1,1,2,9585,3,15;1,1,2,9615,3,15;1,1,2,9645,3,15;1,1,2,9675,3,15;1,8,2,9705,3,15;1,8,2,9735,3,15;1,8,2,9765,3,15;1,1,2,9795,3,15;1,1,2,9825,3,15;1,1,2,9855,3,15;";

        console.log('Loading level...');
        let level = GDLevel.parse(renderer, levelString);
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

        playing = false;

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