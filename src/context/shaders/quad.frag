#version 300 es

precision highp float;

out vec4 outColor;

in vec4 oColor;
in vec2 oTexFrag;

uniform bool uTextureEnabled;

uniform sampler2D uTexture;

void main() {
    if (uTextureEnabled) {
        outColor = texture(uTexture, oTexFrag) * oColor;
    } else {
        outColor = oColor;
    }
}
