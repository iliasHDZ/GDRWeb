#version 300 es

precision highp float;

out vec4 outColor;

in vec2 oPos;

uniform float uGridWidth;

void main() {
    vec2 gridPos = vec2(mod(oPos.x - 15.0, 30.0), mod(oPos.y - 15.0, 30.0));

    gridPos = vec2(abs(gridPos.x - 15.0), abs(gridPos.y - 15.0));

    if (gridPos.x < uGridWidth / 2.0 || gridPos.y < uGridWidth / 2.0) {
        outColor = vec4(0, 0, 0, 1);
        return;
    }
    
    discard;
}
