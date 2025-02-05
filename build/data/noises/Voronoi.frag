#include ../../data/noises/utils.glsl

void main()
{
    UV_PREPROCESS

    vec3 tmp;
    fragColor.rgb = voronoi3d(vec3(10.0*auv, 0), tmp).rrr;
    fragColor.rgb = rand3to1(tmp).rrr;
}