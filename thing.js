import fs from 'fs';

const layers = JSON.parse(fs.readFileSync('layers.json'));

const zlayers = [-5, -3, -1, 1, 3, 5, 7, 11];

let isBlendingOnTop = {};

for (const [rawZlayer, spritesheet, blending] of layers) {
    const zlayer = zlayers.indexOf(rawZlayer);

    if (isBlendingOnTop[zlayer] && typeof(isBlendingOnTop[zlayer][spritesheet]) == 'boolean')
        continue;

    if (!isBlendingOnTop[zlayer])
        isBlendingOnTop[zlayer] = {};

    isBlendingOnTop[zlayer][spritesheet] = !blending;
}

fs.writeFileSync('blending_on_top.json', JSON.stringify(isBlendingOnTop, null, 4));