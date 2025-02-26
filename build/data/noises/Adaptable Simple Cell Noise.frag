#include ../../data/noises/utils.glsl

#include functions/FiltrableNoises.glsl

void main()
{
    UV_PREPROCESS

    // auv *= 0.5 + 15 * abs(cos(_iTime*0.5));

    // auv -= 2.0;
    // auv *= 2.0;

    float seed = 0.;
    float exageration = 5.;


    // a = 0.0;

    auv *= 2.5;

    auv *= 1.0 + 60.f*(cos(_iTime)*0.5 + 0.5);

    float a = cos(_iTime)*0.5 + 0.5;
    a = clamp(((auv.x*0.25 + 0.25)), 0, 1);
    // a = gradientNoise(auv*10.0);

    float timec = _iTime;
    // timec = 0.1;

    // vec2  F = 0.5*vec2( 0.1, 0.1+ (0.5+0.5*cos(2.*.5*timec)));
    // vec2  O = 0.5*vec2( 0.1, 0.1+ (0.5+0.5*sin(2.*.2*timec))*PI*2.);
    // // Filtered local random phase noise
    // a = filtered_local_random_phase_noise(timec*.1 + auv/40.,5.,15,F, O)*.5 + .5;

    // a = clamp(pow(a, .5) , 0., 1.);


    fragColor.rgb = FilteredSpikeNoise(auv, 1., 1, a, exageration, seed, timec).rrr;
    // fragColor.rgb += a*0.5;
    return;

}