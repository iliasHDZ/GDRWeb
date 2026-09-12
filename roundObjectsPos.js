import fs from 'fs';

const json = JSON.parse(fs.readFileSync("./objects.json"));

for (const [id, object] of Object.entries(json)) {
    for (const sprite of object.sprites) {
        sprite.x = Math.round(sprite.x * 10000) / 10000;
        sprite.y = Math.round(sprite.y * 10000) / 10000;
        sprite.scaleX = Math.round(sprite.scaleX * 10000) / 10000;
        sprite.scaleY = Math.round(sprite.scaleY * 10000) / 10000;
        sprite.contentWidth = Math.round(sprite.contentWidth * 10000) / 10000;
        sprite.contentHeight = Math.round(sprite.contentHeight * 10000) / 10000;
        sprite.rotation = Math.round(sprite.rotation * 10000) / 10000;
    }
}

fs.writeFileSync("./assets/object.json", JSON.stringify(json, null, 4));