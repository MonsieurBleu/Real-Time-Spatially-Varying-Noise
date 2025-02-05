#include ../../data/noises/utils.glsl

void main()
{
    UV_PREPROCESS

    vec3 tmp;
    fragColor.rgb = gradientNoise(auv*10.0).rrr;
}