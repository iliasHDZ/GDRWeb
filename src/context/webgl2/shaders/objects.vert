#version 300 es

in vec2 aPos;
in vec2 aTex;
in vec4 aGroups;
in float aHsv;
in vec4 aSCp;

in float aFlags;
in float aCol;

uniform mat3 uView;

out vec2 oTex;
out vec4 oSCp;

out vec4 oColor;
out float oAlpha;

flat out int oBlending;
flat out int oFlags;

vec2 pulseSels[4];

uniform sampler2D uColorInfoTexture;
uniform sampler2D uGroupStateTexture;
uniform sampler2D uObjectHSVTexture;
uniform sampler2D uPulseTexture;

struct GroupState {
    float opacity;
    vec2 offset;
    vec2 pulseSel;
};

struct HSVShift {
    float hue;
    float sat;
    float val;
    bool satAdd;
    bool valAdd;
};

out GroupState oGroup;

vec4 getInfoTexPix(int i, int tex) {
    vec2 size = vec2(0, 0);
    if (tex == 0)
        size = vec2(textureSize(uColorInfoTexture, 0));
    else if (tex == 1)
        size = vec2(textureSize(uGroupStateTexture, 0));
    else if (tex == 2)
        size = vec2(textureSize(uObjectHSVTexture, 0));
    else
        size = vec2(textureSize(uPulseTexture, 0));

    vec2 texCoords = vec2(mod(float(i), size.x) + 0.5, floor(float(i) / size.x) + 0.5) / size;
    if (tex == 0)
        return texture(uColorInfoTexture, texCoords);
    else if (tex == 1)
        return texture(uGroupStateTexture, texCoords);
    else if (tex == 2)
        return texture(uObjectHSVTexture, texCoords);
    else
        return texture(uPulseTexture, texCoords);
}

GroupState combineGroupStates(GroupState s1, GroupState s2) {
    GroupState res;
    res.opacity = s1.opacity * s2.opacity;
    res.offset  = s1.offset + s2.offset;
    return res;
}

GroupState getGroupState(int id) {
    vec4 a = getInfoTexPix(id * 2, 1);
    vec4 b = getInfoTexPix(id * 2 + 1, 1);

    GroupState res;
    res.opacity  = a.r;
    res.offset   = a.gb;
    res.pulseSel = b.xy;
    return res;
}

GroupState getGroupStateFromGroups(vec4 groups) {
    GroupState current;
    GroupState state;
    bool gsp = false;

    current.opacity = 1.0;
    current.offset  = vec2(0, 0);

    if (groups.x != 0.0) {
        state = getGroupState(int(groups.x));
        if (gsp)
            current = combineGroupStates(current, state);
        else
            current = state;
        pulseSels[0] = state.pulseSel;
        gsp = true;
    } else
        pulseSels[0] = vec2(0, 0);

    if (groups.y != 0.0) {
        state = getGroupState(int(groups.y));
        if (gsp)
            current = combineGroupStates(current, state);
        else
            current = state;
        pulseSels[1] = state.pulseSel;
        gsp = true;
    } else
        pulseSels[1] = vec2(0, 0);

    if (groups.z != 0.0) {
        state = getGroupState(int(groups.z));
        if (gsp)
            current = combineGroupStates(current, state);
        else
            current = state;
        pulseSels[2] = state.pulseSel;
        gsp = true;
    } else
        pulseSels[2] = vec2(0, 0);

    if (groups.w != 0.0) {
        state = getGroupState(int(groups.w));
        if (gsp)
            current = combineGroupStates(current, state);
        else
            current = state;
        pulseSels[3] = state.pulseSel;
        gsp = true;
    } else
        pulseSels[3] = vec2(0, 0);

    return current;
}

// const uns = v => Math.abs(v) + 128 * +(v < 0)
// const dens = a => (a >= 128) ? -(a % 128) : (a % 128)

float pixFloatToSignedFloat(float a) {
    a *= 255.0;
    return (a >= 128.0) ? -mod(a, 128.0) : mod(a, 128.0);
}

int imod(int a, int n){
    return a - (n * (a/n));
}

HSVShift getHSVFromPix(vec4 pix) {
    int flags = int(pix.a * 255.0);

    int hueNeg = flags / 128;
    int hue = int(pix.r * 255.0) * (hueNeg == 1 ? -1 : 1);

    HSVShift hsv;
    hsv.hue = float(hue) / 360.0;
    hsv.satAdd = mod(float(flags / 64), 2.0) > 0.5;
    hsv.valAdd = mod(float(flags / 32), 2.0) > 0.5;
    hsv.sat = hsv.satAdd ? pixFloatToSignedFloat(pix.g) / 100.0 : pix.g * 2.0;
    hsv.val = hsv.valAdd ? pixFloatToSignedFloat(pix.b) / 100.0 : pix.b * 2.0;
    return hsv;
}

HSVShift getObjectHSVShift(int hsvId) {
    vec4 pix = getInfoTexPix(hsvId, 2);

    return getHSVFromPix(pix);
}

// Credits to sam hocevar for the following two functions
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 shiftColor(vec4 color, HSVShift shift) {
    vec3 hsv = rgb2hsv(color.rgb);

    hsv.x = mod(hsv.x + shift.hue, 1.0);

    if (shift.satAdd)
        hsv.y += shift.sat;
    else
        hsv.y *= shift.sat;

    if (shift.valAdd)
        hsv.z += shift.val;
    else
        hsv.z *= shift.val;

    hsv.y = clamp(hsv.y, 0.0, 1.0);
    hsv.z = clamp(hsv.z, 0.0, 1.0);

    return vec4(hsv2rgb(hsv), color.a);
}

vec4 applyPulseEntryToColor(vec4 color, int idx) {
    vec4 pe1 = getInfoTexPix(idx * 2, 3);
    vec4 pe2 = getInfoTexPix(idx * 2 + 1, 3);
    
    float intensity = pe1.x;
    vec3 ncolor = vec3(0, 0, 0);
    if (pe1.w < 0.1) {
        return color;
    } else if (pe1.w < 0.5) {
        ncolor = pe2.rgb;
    } else {
        ncolor = shiftColor(color, getHSVFromPix(pe2)).rgb;
    }
    return vec4(mix(color.rgb, ncolor, intensity), color.a);
}

vec4 applyPulseSelToColor(vec4 color, vec2 sel) {
    int idx  = int(sel.x);
    int size = int(sel.y);

    for (int i = idx; i < idx + size; i++) {
        color = applyPulseEntryToColor(color, i);
    }

    return color;
}

vec4 getChannelColor(int channel) {
    if (int(channel) == 1010)
        return vec4(0, 0, 0, 1);
    else if (int(channel) == 1011)
        return vec4(1, 1, 1, 1);

    float y = (float(channel) + 0.5) / 1011.0;

    return texture(uColorInfoTexture, vec2(0.5 / 2.0, y));
}

bool isChannelBlending(int channel) {
    if (int(channel) == 1010)
        return false;
    else if (int(channel) == 1011)
        return false;

    float y = (float(channel) + 0.5) / 1011.0;

    return texture(uColorInfoTexture, vec2(1.5 / 2.0, y)).r > 0.5;
}

void main() {
    oTex = aTex;
    oSCp = aSCp;

    oColor = getChannelColor(int(aCol));
    oBlending = isChannelBlending(int(aCol)) ? 1 : 0;

    GroupState state = getGroupStateFromGroups(aGroups);

    oColor = applyPulseSelToColor(oColor, pulseSels[0]);
    oColor = applyPulseSelToColor(oColor, pulseSels[1]);
    oColor = applyPulseSelToColor(oColor, pulseSels[2]);
    oColor = applyPulseSelToColor(oColor, pulseSels[3]);

    oAlpha = state.opacity;

    if (int(aHsv) != 0) {
        HSVShift shift = getObjectHSVShift(int(aHsv));
        oColor = shiftColor(oColor, shift);
    }

    vec2 position = aPos;

    position += state.offset;

    oFlags = int(aFlags);

    if (imod(oFlags / 2, 2) > 0)
        oColor = vec4(0, 0, 0, 1);

    gl_Position = vec4(uView * vec3(position, 1), 1);
}
