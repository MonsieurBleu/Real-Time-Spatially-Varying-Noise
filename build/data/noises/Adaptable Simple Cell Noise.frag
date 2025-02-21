#include ../../data/noises/utils.glsl

float lsmoothstep(float edge0, float edge1, float x)
{
    float t;  /* Or genDType t; */
    t = clamp((x - edge0) / (edge1 - edge0), 0., 1.);
    return t;
}

float parametrablePointNoise2(vec2 uv, float size, float dist, float exageration, float seed)
{
    vec2 c = round(uv/size)*size;
    c += (rand3to2(vec3(c.xy, seed))*2.0 - 1.0)*size*0.25;

    float i = rand3to1(vec3(seed ,c.yx));

    i = mix(0.35, 1.0, i*exageration*dist);
    // i = max(i, 0.35);

    // return 1.0 - 4.0*distance(uv, c)/(size * i);

    return clamp(1.0 - 4.0*distance(uv, c)/(size * i), 0., 1.);

    return smoothstep(0.0, i, 1.0 - 4.0*distance(uv, c)/size);
}

/*
    0.3 : 0.142
    0.5 : 0.111
    1.0 : 0.058
    2.0 : 0.0193
    3.0 : 0.0092
*/

float getE1(vec2 uv, float size, float dist, float exageration, float seed)
{
    // return 2.0 + cos(_iTime);
    // return 1.0;

    vec2 c = round(uv/size)*size;
    c += (rand3to2(vec3(c.xy, seed))*2.0 - 1.0)*size*0.25;

    float i = rand3to1(vec3(seed , c.yx)) ;
    i = max(i, 0.35);
    i = mix(i, exageration, dist);
    return i;
}

float parametrablePointNoise(vec2 uv, float size, float dist, float exageration, float seed)
{
    vec2 c = round(uv/size)*size;
    c += (rand3to2(vec3(c.xy, seed))*2.0 - 1.0)*size*0.25;

    // float i = rand3to1(vec3(seed ,c.yx)) ;
    // i = max(i, 0.35);
    // i = mix(i, exageration, dist);
    float i = getE1(uv, size, dist, exageration, seed);

    return lsmoothstep(0.0, i, 1.0 - 4.0*distance(uv, c)/size);
}



void main()
{
    UV_PREPROCESS

    // auv *= 0.5 + 15 * abs(cos(_iTime*0.5));

    // auv -= 2.0;
    // auv *= 2.0;

    float seed = 0.;
    float exageration = 4.0;


    float a = cos(_iTime)*0.5 + 0.5;
    a = clamp(((auv.x*0.25 + 0.25)), 0, 1);
    a = 0.0;

    auv *= 2.5;

    // a = 0.0;

    vec2[5] gridOff = vec2[5](
        vec2(+.0, +.0)*SQR2,
        vec2(+.5, +.5)*SQR2,
        vec2(-.5, +.5)*SQR2,
        vec2(+.5, -.5)*SQR2,
        vec2(-.5, -.5)*SQR2
    );

    int l = 0;
    // l = int(3.5*(abs(cos(_iTime))));
    // l = 1;

    float n;
    
    for(int j = 0; j < 5; j++)
    {
        // vec3 r = rand3to3(j.rrr);
        // vec2 juv = auv + SQR2*(r.xy - 0.5);

        vec2 juv = auv + gridOff[j];
        // float intensity = mix(max(vulpineHash2to1(cuv, seed), 0.35), exageration, a);

        float dn = 0.;
        float dw = 0.;



        if(l == 0)
        {
            vec2 cuv = round(juv) + .25*vulpineHash2to2(round(juv), seed);
            float intensity = mix(.35, exageration * smoothstep(-1., 1., a), vulpineHash2to1(cuv, seed) + a);

            float dist = 1. - 4.*distance(juv, cuv);

            // vec2 diff = juv - cuv;
            // float dist = 1. - 16.*(diff.x*diff.x + diff.y*diff.y);

            // dn += clamp(dist/intensity, 0., 1.);

            dn += smoothstep(0., intensity, dist);
        }
        else
        {
            for(int mi = -l; mi <= l; mi++)
            for(int mj = -l; mj <= l; mj++)
            {
                vec2 duv = juv + vec2(mi, mj);
                vec2 cuv = round(duv) + .25*vulpineHash2to2(round(duv), seed);
                float intensity = mix(.35, exageration * smoothstep(-1., 1., a), vulpineHash2to1(cuv, seed) + a);

                // float e1 = getE1(duv, 1.0, a, 5.0, j);


                

                // vec2 c = round(duv);
                // c += (rand3to2(vec3(c.xy, j))*2.0 - 1.0)*0.25;

                /* TODO : utiliser des poids gaussien plutôt*/ 
                float w = 1.0*l - distance(juv, cuv);
                w = clamp(w, 0., 1.);

                dw += w;

                float r2 = 1. - min(intensity, 1.);
                dn += w * (PI/48.)*(1. - r2*r2)/intensity;
            }
            dn /= dw;
        }

        n += dn;
        // n = max(n, dn);
    }

    // n = smoothstep(0., 1., n);

    // n *= 0.1;
    
    fragColor.rgb = n.rrr;

}