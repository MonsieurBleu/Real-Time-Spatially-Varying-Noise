#include ../../data/noises/utils.glsl

void main()
{
    UV_PREPROCESS

    float slice = 0.001 * pow(xrange.y, 4.0);
    float a = uv.x*(1.+slice) - slice*.5;
    a = clamp(a, 0., 1.);
    a = smoothstep(0., 1., a);

    vec3 nVorCenter;
    vec3 nVor = voronoi3d(vec3(10.0*auv, 0), nVorCenter).rgb;

    fragColor.rgb = a.rrr;

    if(a > 1.0)
        fragColor.rgb = vec3(1, 0, 0);
    else if(a < 0.)
        fragColor.rgb = vec3(0, 1, 0);
}