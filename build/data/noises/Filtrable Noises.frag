#include ../../data/noises/utils.glsl

#include functions/FiltrableNoises.glsl

void main()
{
    UV_PREPROCESS

    // auv *= 0.5 + 15 * abs(cos(_iTime*0.5));


    fragColor.rgb = filtered_local_random_phase_noise(
        auv,
        5.0,
        1,
        0.1*vec2(SQR3, E),
        0.1*vec2(PHI, SQR2)
    ).rrr*0.5 + 0.5;

}