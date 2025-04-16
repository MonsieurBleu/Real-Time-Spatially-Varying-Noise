#include ../../data/noises/utils.glsl

void main()
{
    UV_PREPROCESS

    fragColor.rgb = hsv2rgb(vec3(_iTime*0.1, uv.x, uv.y));
}