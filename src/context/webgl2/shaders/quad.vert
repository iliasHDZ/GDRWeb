#version 300 es

in vec2 aPos;

uniform mat3 uView;
uniform mat3 uModel;

uniform vec4 uColor;

out vec4 oColor;
out vec2 oTexFrag;

void main() {
    oColor = uColor;

    oTexFrag = vec2(aPos.x + 0.5, 1.0 - (aPos.y + 0.5));
    gl_Position = vec4(uView * uModel * vec3(aPos, 1), 1);
}
