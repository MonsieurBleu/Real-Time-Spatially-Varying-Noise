#include ../../data/noises/utils.glsl

float lsmoothstep(float edge0, float edge1, float x)
{
    float t;  /* Or genDType t; */
    t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
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

    auv -= 2.0;
    auv *= 0.25;
    // auv *= 2.0;


    float a = cos(_iTime)*0.5 + 0.5;
    a = clamp(((auv.x + 0.25)), 0, 1);

    // a = 0.0;

    float n;
    for(float j = 0; j < 5.; j++)
    {
        vec3 r = rand3to3(j.rrr);

        vec2 juv = auv + SQR2*(r.xy - 0.5);

        // clamp(n, 0., 1.);
        



        float dn = 0.0;
        float dw = 0.0;

        float s = 0.1;

        int l = 0;

        l = int(3.5*(abs(cos(_iTime))));

        if(l == 0)
            dn = parametrablePointNoise(juv, s, a, 5.0, j);
        else
        {
            for(int mi = -l; mi <= l; mi++)
            for(int mj = -l; mj <= l; mj++)
            {
                vec2 duv = juv + s*vec2(mi, mj);
                float e1 = getE1(duv, s, a, 5.0, j);
                float r2 = 1. - min(e1, 1.);
                

                vec2 c = round(duv/s)*s;
                c += (rand3to2(vec3(c.xy, j))*2.0 - 1.0)*s*0.25;

                /* TODO : utiliser des poids gaussien plutôt*/ 
                float w = 1.0*l - distance(juv, c)/s;
                w = clamp(w, 0., 1.);

                dw += w;
                dn += w*(PI/48.)*(1. - r2*r2)/e1;
            }
            dn /= dw;
        }


        // dn /= (l+l+1.)*(l+l+1.);

        // dn += (PI/3.)*.25*.25*ie1;
        // dn += -(PI/3.)*(ie1 - 1.)*r2*r2;


        // dn += PI / (24. * getE1(juv, 0.1, a, 5.0, j));
        // dn += PI / (24. * getE1(juv + vec2(s, s), s, a, 5.0, j));
        // dn += PI / (24. * getE1(juv + vec2(-s, s), s, a, 5.0, j));
        // dn += PI / (24. * getE1(juv + vec2(s, -s), s, a, 5.0, j));
        // dn += PI / (24. * getE1(juv + vec2(-s, -s), s, a, 5.0, j));
        // dn += PI / (24. * getE1(juv + vec2(0, s), s, a, 5.0, j));
        // dn += PI / (24. * getE1(juv + vec2(0, -s), s, a, 5.0, j));
        // dn += PI / (24. * getE1(juv + vec2(s, 0), s, a, 5.0, j));
        // dn += PI / (24. * getE1(juv + vec2(-s, 0), s, a, 5.0, j));
        // dn /= 9.;
        

        if(false)
        // if(cos(_iTime*3.0) > .0)
        {
            n += parametrablePointNoise(juv, s, a, 5.0, j);
        }
        else
        {
            n += dn;
        }

        // if(parametrablePointNoise(juv, 0.1, a, 5.0, j) <= 0.)
        //     discard;

        // n = 1.0-e1;
    }

    // n *= 7.0;
    
    fragColor.rgb = n.rrr;

}