#include ../../data/noises/utils.glsl

float parametrablePointNoise(vec2 uv, float size, float dist, float exageration, float seed)
{
    vec2 c = round(uv/size)*size;
    c += (rand3to2(vec3(c.xy, seed))*2.0 - 1.0)*size*0.25;

    float i = rand3to1(vec3(seed ,c.yx)) ;
    i = max(i, 0.35);
    i = mix(i, exageration, dist);

    return smoothstep(0.0, i, 1.0 - 4.0*distance(uv, c)/size);
}

vec3 deriveTest(vec2 uv, float size, float dist, float exageration, float seed)
{
    /* Center of the cell */
    vec2 c = round(uv/size)*size;
    c += (rand3to2(vec3(c.xy, seed))*2.0 - 1.0)*size*0.25;

    /* Smoothstep random intensity (max range) based on cell center*/
    float i = rand3to1(vec3(seed ,c.yx)) ;
    i = max(i, 0.35);
    i = mix(i, exageration, dist);

    /* Noise useful constants */
    const float e0 = 0.0;
    const float e1 = i;
    const float a = (-4/size)/(e1 - e0);

    /* Normalized distance from cell */
    float D = distance(uv, c)/size;
    float delta = 1.0 - 4.0*D;

    /* Excluding the intervals where the noise function is flat */
    if(delta < e0 || delta > e1)
        return vec3(0, 0, 1);

    /* Calculating the smoothstep interval adjusted delta */
    float t = (delta - e0)/(e1 - e0);

    /* Derivating the smoothstep interval adjustement part */
    vec2 dt = a * (uv - c)/D;

    /* Derivating the smoothstep function */
    vec2 dg = 6.0*(a*dt)*t*(1-t);

    /* Creating slopes and 3D tangent normal of the noise */
    vec3 slope1 = vec3(1, 0, dg.x);
    vec3 slope2 = vec3(0, 1, dg.y);
    vec3 normal = normalize(cross(slope1, slope2));

    return normal;
}

struct noiseResult
{
    float result;
    vec3 normal;
};

noiseResult spikeNoise(vec2 uv, float size, float dist, float exageration, float seed)
{
    noiseResult r;

    /* Center of the cell */
    vec2 c = round(uv/size)*size;
    c += (rand3to2(vec3(c.xy, seed))*2.0 - 1.0)*size*0.25;

    /* Smoothstep random intensity (max range) based on cell center*/
    float i = rand3to1(vec3(seed ,c.yx)) ;
    i = max(i, 0.35);
    i = mix(i, exageration, dist);

    /* Noise useful constants */
    const float e0 = 0.0;
    const float e1 = i;
    const float a = (-4/size)/(e1 - e0);

    /* Normalized distance from cell */
    float D = distance(uv, c);
    float delta = 1.0 - 4.0*D/size;

    /* Excluding the intervals where the noise function is flat */
    if(delta < e0)
        r.normal = vec3(0, 0, 1);
    else
    {
        /* Calculating the smoothstep interval adjusted delta */
        float t = (delta - e0)/(e1 - e0);

        /* Derivating the smoothstep interval adjustement part */
        vec2 dt = a * (uv - c)/D;

        /* Derivating the smoothstep function */
        vec2 dg = 6.0*(a*dt)*t*(1-t);

        /* Creating slopes and 3D tangent normal of the noise */
        r.normal = sign(e1-delta)*normalize(cross(vec3(1, 0, dg.x), vec3(0, 1, dg.y)));
    }

    r.result = smoothstep(e0, e1, delta*0.5);

    return r;
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

    // auv.x -= 2.0;

    float size = 0.075;

    float a = cos(_iTime)*0.5 + 0.5;

    a = clamp(((auv.x + 0.25)), 0, 1);

    // a = 0;

    // a = distanceFunction(auv);

    vec3 tmp;
    // a = voronoi3d(auv.xyy, tmp).r;

    float sum = 0;

    noiseResult final;
    final.result = 0;
    final.normal = vec3(0, 0, 1);

    // sum += parametrablePointNoise(auv, 0.1, a, 5.0, 0.0);

    // {
    //     vec2 nuv = rotate(auv, vec2(0), radians(65.f));

    //     sum += parametrablePointNoise(nuv, 0.1, a, 5.0, 1.0);
    // }

    for(int i = 0; i < 40; i++)
    {
        float j = float(i);
        float exageration = 4.0;
        // exageration += (cos(_iTime)*0.5 + 0.5)*50.0;
        // exageration = 10.0;

        exageration = 1.25;

        // vec2 off = rand3to2(i.rrr);

        // float ppn = parametrablePointNoise(auv + size*SQR2*rand3to2(j.rrr), size, a, exageration, j);
        // // // sum += ppn;
        // sum = max(sum, ppn);

        noiseResult s = spikeNoise(auv + size*SQR2*rand3to2(j.rrr), size, a, exageration, j);
        if(s.result >= final.result)
        {
            final = s;
        }
    }

    final.result *= 0.9;
    final.result += smoothstep(0.5, 1., 1.0-a)*0.2;
    // final.result = smoothstep(0., 1., final.result);


    float ld = dot(final.normal, normalize(vec3(cos(_iTime), sin(_iTime), 1)));
    // fragColor.b = 0.0;
    fragColor.g = 0.1 + ld.r;

    fragColor.rgb = final.normal * 0.5 + 0.5;
    fragColor.rgb = final.result.rrr;

}