#version 460

#include uniform/Base3D.glsl
#include uniform/Model3D.glsl

#include functions/Noise.glsl
#include functions/HSV.glsl

layout (location = 0) out vec4 fragColor;
layout (location = 32) uniform vec2 xrange;
layout (location = 33) uniform vec2 yrange;

in vec2 uv;
in vec2 scale;

void CorrectUV(in out vec2 auv, vec2 scale)
{    
    vec2 ascale = scale;
    ascale.y /= float(_iResolution.x)/float(_iResolution.y);

    if(ascale.x > ascale.y)
    {
        auv.x *= ascale.x/ascale.y;
        auv.x -= 0.5 * (scale.x/scale.y) * (float(_iResolution.x)/float(_iResolution.y));
        auv.x += 0.5;
        auv *= float(_iResolution.y)/1000;
    }
    else
    {
        auv.y /= ascale.x/ascale.y;
        auv.y += 0.5;
        auv.y -= 0.5 * (scale.y/scale.x) * (float(_iResolution.y)/float(_iResolution.x));
        auv *= float(_iResolution.x)/1000;
    }
}

#define UV_PREPROCESS \
    vec2 auv = uv *2.0 - 1.0;       \
    float viewUVoffMax = 8.0;       \
    auv += 0.0 * (mod(_iTime*0.05, viewUVoffMax) - viewUVoffMax*0.5); \
    auv.x *= xrange.y * 0.5;        \
    auv.y *= yrange.y * 0.5;        \
    CorrectUV(auv, scale);          \
    fragColor.a = 1.0;