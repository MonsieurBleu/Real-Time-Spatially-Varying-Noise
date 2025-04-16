#include ../../data/noises/utils.glsl

float squaredDistance(vec2 a, vec2 b)
{
    return (a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y);
}

void main()
{
    UV_PREPROCESS
    
    // auv.x += 1.;
    // auv *= 0.25;
    // auv *= 1e2;
    auv *= 20;

    // auv = abs(auv ) + vec2(6, 3);

    // auv.y += cos(_iTime)*100.;

    // if(uv.x > .5) auv.y += 1e2;

    float ty = auv.y;
    ty = length(auv) * 2.;

    // auv.y = mod(auv.y, 2.) - 1.;
    // auv.y = acos(auv.y);
    auv.y = cos(auv.y);

    float x = auv.x - mod(auv.y, 0.);
    // x += ty*ty*1e-2;
    float y = tan(x + ty);

    // y = fract(y);



    float d = distance(y, mod(auv.y, 0.))*1e-1;

    d = pow(d, .25);

    fragColor.rgb = d.rrr;

}