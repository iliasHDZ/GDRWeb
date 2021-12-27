#version 300 es

precision highp float;

out vec4 outColor;

in  vec2 oTex;
in  vec4 oSCp;

in float oCol;

uniform sampler2D uTexture;

uniform vec4 uColors[1011];

vec4 getTexFrag(vec2 pos) {
    vec2 texCoords = pos / vec2(textureSize(uTexture, 0));
    return texture(uTexture, texCoords);
}

void main() {
    float cor = 0.5;

    vec2 texPos = vec2(max(min(oTex.x, oSCp.z - cor), oSCp.x + cor), max(min(oTex.y, oSCp.w - cor), oSCp.y + cor));

    vec2 corPos = vec2(floor(texPos.x - 0.5) + 0.5, floor(texPos.y - 0.5) + 0.5);

    vec4 fTL = getTexFrag(corPos);
    vec4 fTR = getTexFrag(corPos + vec2(1, 0));
    vec4 fBL = getTexFrag(corPos + vec2(0, 1));
    vec4 fBR = getTexFrag(corPos + vec2(1, 1));

    bool aTL = fTL.w > 0.0;
    bool aTR = fTR.w > 0.0;
    bool aBL = fBL.w > 0.0;
    bool aBR = fBR.w > 0.0;

    vec4 texFrag;

    if ((aTL || aTR || aBL || aBR) && (!aTL || !aTR || !aBL || !aBR)) {
        int as = 0;

        vec3 avr = vec3(0, 0, 0);

        if (aTL) {
            avr += fTL.xyz;
            as++;
        }
        if (aTR) {
            avr += fTR.xyz;
            as++;
        }
        if (aBL) {
            avr += fBL.xyz;
            as++;
        }
        if (aBR) {
            avr += fBR.xyz;
            as++;
        }

        avr = vec3(avr.x / float(as), avr.y / float(as), avr.z / float(as));

        if (!aTL)
            fTL = vec4(avr, 0);
        if (!aTR)
            fTR = vec4(avr, 0);
        if (!aBL)
            fBL = vec4(avr, 0);
        if (!aBR)
            fBR = vec4(avr, 0);

        vec2 posIn = texPos - corPos;

        vec4 mixT = mix(fTL, fTR, posIn.x);
        vec4 mixB = mix(fBL, fBR, posIn.x);

        texFrag = mix(mixT, mixB, posIn.y);
    } else
        texFrag = getTexFrag(texPos);

    outColor = texFrag * uColors[int(oCol)];
}