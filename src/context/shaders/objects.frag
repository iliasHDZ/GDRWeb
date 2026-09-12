#version 300 es

precision highp float;

out vec4 outColor;

in vec2 oTex;

in vec4 oColor;
in float oAlpha;

flat in int oBlending;

flat in int oFlags;

uniform bool uHideTriggers;

uniform sampler2D uTexture;

int imod(int a, int n){
    return a - (n * (a/n));
}

vec4 getTexFrag(vec2 pos) {
    return texture(uTexture, pos / vec2(textureSize(uTexture, 0)));
}

void main() {
    if (uHideTriggers && imod(oFlags / 4, 2) > 0)
        discard;

    /*
    outColor = getTexFrag(oTex) * oColor;
    outColor.a *= oAlpha;
    outColor = vec4(outColor.rgb * outColor.a, outColor.a);
    if (oBlending == 1)
        outColor = vec4(outColor.rgb * outColor.a, 0.0);
    */
    outColor = getTexFrag(oTex);
    outColor *= oColor;
    outColor.rgb *= outColor.a;
    // outColor.rgb *= outColor.a;
    /*
    if (oBlending == 1) {
        outColor.rgb *= outColor.a;
        outColor.a = 0.0;
    }
    */
}
