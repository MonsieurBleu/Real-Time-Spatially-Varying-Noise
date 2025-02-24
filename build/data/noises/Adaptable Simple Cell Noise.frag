#include ../../data/noises/utils.glsl

#include functions/FiltrableNoises.glsl

void main()
{
    UV_PREPROCESS

    // auv *= 0.5 + 15 * abs(cos(_iTime*0.5));

    // auv -= 2.0;
    // auv *= 2.0;

    float seed = 0.;
    float exageration = 1.0;


    // a = 0.0;

    auv *= 2.5;

    // auv *= 1.0 + 200.f*(cos(_iTime)*0.5 + 0.5);

    float a = cos(_iTime)*0.5 + 0.5;
    a = clamp(((auv.x*0.25 + 0.25)), 0, 1);
    // a = gradientNoise(auv*10.0);



    fragColor.rgb = FilteredSpikeNoise(auv, 1., 8, a, exageration, seed, _iTime).rrr;
    // fragColor.rgb += a*0.5;
    return;

}