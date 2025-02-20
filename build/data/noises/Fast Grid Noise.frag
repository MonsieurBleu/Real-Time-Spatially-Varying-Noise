#include ../../data/noises/utils.glsl


void main()
{
    UV_PREPROCESS

    auv *= 20.0;
    auv = round(auv);

    float seed = (_iTime);
    seed = 0.;

    fragColor.rgb = vulpineHash2to3(auv, seed);
}