#include ../../data/noises/utils.glsl

float parametrablePointNoise(vec2 uv, float size, float dist, float exageration, float seed)
{
    vec2 c = round(uv/size)*size;
    c += (rand3to2(vec3(c.xy, seed)) - 0.5)*size*0.5;

    float i = rand3to1(vec3(seed ,c.yx));
    i = mix(i, exageration, dist);

    return 2.0*smoothstep(0.0, i, 1.0 - 4.0*distance(uv, c)/size);
}


vec2 rotate(vec2 uv, vec2 c, float a)
{
    uv -= c;

    uv = vec2(
        uv.x*cos(a) - uv.y*sin(a),
        uv.x*sin(a) + uv.y*cos(a)
    );

    return uv + c;
}

void main()
{
    UV_PREPROCESS
    
    // auv.x += 2.0 * (cos(_iTime)*0.5 + 0.5);

    float size = 0.1;

    float a = cos(_iTime)*0.5 + 0.5;

    a = clamp(((auv.x + 0.5)*0.5), 0, 1);

    // a = 0;

    // a = distanceFunction(auv);

    float sum = 0;

    // sum += parametrablePointNoise(auv, 0.1, a, 5.0, 0.0);

    // {
    //     vec2 nuv = rotate(auv, vec2(0), radians(65.f));

    //     sum += parametrablePointNoise(nuv, 0.1, a, 5.0, 1.0);
    // }

    for(int i = 0; i < 10; i++)
    {
        float j = float(i);
        float exageration = 4.0;
        // exageration += (cos(_iTime)*0.5 + 0.5)*50.0;
        float ppn = 0.5*parametrablePointNoise(auv + size*SQR2*j, 0.1, a, exageration, j);
        // sum += ppn;
        sum = max(sum, ppn);
    }

    sum = clamp(sum, 0, 1);

    // fragColor.rgb = pow(sum.rrr, vec3(0.5));
    // fragColor.rgb = pow(sum.rrr, vec3(0.5));
    fragColor.rgb = sum.rrr;

    // fragColor.g = sum;
    // fragColor.b = a;
}