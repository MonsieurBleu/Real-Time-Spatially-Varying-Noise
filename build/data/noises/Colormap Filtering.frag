#include ../../data/noises/utils.glsl
#include functions/Steps.glsl

vec3 gradient_filtering(
    vec3 c1, vec3 c2,
    float mean, 
    float truemean,
    float vari,
    float smoo,
    float tmp
)
{
    vari = clamp(vari, 0., 1.);
    // return mix(
    //     c1, c2, 
    //     clamp(
    //         mix((mean-.5)*(1.-smoo) + .5, tmp, linearstep(.5, 1., vari))
    //         , 0., 1.
    //         )
    // );
    
    // return mix(
    //     c1, c2, 
    //     clamp(
    //         mix((mean-.5)/mix(smoo, 1., vari) + .5, tmp, vari)
    //         , 0., 1.
    //         )
    // );

    // smoo = 1;

    // smoo += vari;

    // return mix(
    //     c1, c2, 
    //     clamp(
    //         .5 + (mean-.5)/(smoo)
    //     , 0, mix(1.0, tmp, min(smoo*.5, 1.0)))
    // );


    smoo += vari*2.;

    float trueMeanDist = vari - 2.*distance(truemean, .5);
    trueMeanDist = smoo*.5 - 2.*distance(truemean, .5);
    // trueMeanDist = mean;

    // mean = .5;
    // vari = 1.0;

    // return trueMeanDist.rrr;

    mean = clamp((mean-.5)/smoo + .5, 0., 1.);

    mean = mix(mean, tmp, clamp(trueMeanDist, 0., 1.));

    return c2*mean + c1*(1-mean);
}

vec3 simpleColormapReduction(
    vec3 c,  /* current filtered colormap value */
    float mean, /* current filtered colormap mean */
    float vari,  /* current filtered colormap variation*/
    float sizef, /* current colormap gradient size */
    vec3 fm, /* colormap value to be reduced */
    float m, /* mean at that colormap value*/
    float x /* weight reduction */
)
{
    return mix(
        c, 
        (sizef/(sizef-1.+x))*(c - (1.-x)*fm/sizef), 
        // clamp(vari - distance(mean, m), 0., 1.)
        clamp(vari * (1. - distance(mean, m)), 0., 1.)
        );
}

vec3 meanExtraction(
    vec3 curMean,    /* current color mean */
    vec3 affMean,    /* color of the affected portion */
    float curWeight, /* current weight of the affected portion in the mean */
    float mul  /* weight multiplier to be applied  */
)
{
    mul = 1.-mul;
    return

        // ((1./curWeight)/(1./curWeight - mul))*(curMean - affMean*curWeight*mul)


        (curMean - affMean*curWeight*mul)/(1. - mul*curWeight)
    ;
}


vec3 Hei13Colormap(float mean, float vari)
{
    vec3 colors[] = vec3[4](
        vec3(1., 1., 0.),
        vec3(1., 0., 0.),
        vec3(0., 0., 0.),
        vec3(1., 1., 1.)

        // vec3(1., 1., 1.),
        // vec3(1., 0., 0.),
        // vec3(0., 1., 0.),
        // vec3(0., 0., 1.)
    );

    float s = 0.5;

    vec3 c = gradient_filtering(
        colors[0], 
        colors[1], 
        linearstep(0., 2./4., mean), 
        mean,
        vari, 
        s,
        1./2.
        );

    c = gradient_filtering(
        c, 
        colors[2], 
        linearstep(1./4., 3/4., mean), 
        mean,
        vari, 
        s,
        1./3.
        );

    c = gradient_filtering(
        c, 
        colors[3], 
        linearstep(2./4., 1., mean), 
        mean,
        vari, 
        s,
        1./4.
        );
    
    return c;
}

void main()
{
    UV_PREPROCESS

    // fragColor.rgb = hsv2rgb(vec3(_iTime*0.1, uv.x, uv.y));

    vec3 colors[] = vec3[4](
        // vec3(1., 1., 0.),
        // vec3(1., 0., 1.),
        // vec3(0., 1., 1.),
        // vec3(.5, 1., .5)
        
        // vec3(1., 0., 0.),
        // vec3(0., 1., 0.),
        // vec3(0., 1., 1.),
        // vec3(1., 0., 1.)

        vec3(1., 1., 0.),
        vec3(1., 0., 0.),
        vec3(0., 0., 0.),
        vec3(1., 1., 1.)
    );


    float s = cos(_iTime)*.5 + .5;
    // s = 1e-4;
    s = 0.5;
    // s *= 2.0;

    float vari = uv.x;
    vari = clamp(vari, 0., 1.);

    float mean = uv.y;

    // mean = .5;
    // mean = 1./3.;
    // vari = 1.;

    const int size = 4;
    const float sizef = float(size);

    vec3 c = vec3(0);

    /* L'entrée rouge a désormais un poids de 0 */
    // c = mix(
    //     c, 
    //     (4./3.)*(c - colors[1]/4.), 
    //     clamp(vari - distance(mean, 1./3.), 0., 1.)
    //     );

    /* L'entrée rouge a désormais un poids de 1/2 */
    // c = mix(
    //     c, 
    //     (4./3.5)*(c - colors[1]/8.), 
    //     // clamp(vari - distance(mean, 1./3.), 0., 1.)
    //     1.
    //     );
    /* Valeurs à obtenir : 0.714, 0.57, 0.28 */

    /* L'entrée rouge a désormais un poids de x */
    // vari = 1.0;
    // mean = 0.5;

    if(distance(uv.x, 1.0) < 0.2 && distance(uv.y, 0.5) < 0.1)
    {
        mean = 0.5;
        vari = 1.0;
    }

    c = Hei13Colormap(mean, vari);
    const int maxSection = 0;
    for(int i = 0; i < maxSection*0.75; i++)
    {
        // vari = 1.0;
        // mean = 0.5;

        // vari = 0.;

        // vari = cos(_iTime)*.5 + .5;
        // mean = cos(_iTime)*.5 + .5;

        // vari = 1.0;
        // mean = 0.5;
        

        float x = 0.0; /* weight reduction */
        float m = 0.375; /* mean affected */
        float v = 0.1; /* variance/size of the area affected */

        float Fx = 1.;

        // m = cos(_iTime)*.5 + .5;
        // v = sin(_iTime*SQR2 + PHI)*.25 + .25;

        x = (float(i+1))/float(maxSection);
        // x = pow(x, 20.0);
        // Fx = 21.;
        // x *= Fx;
        // x = pow(distance(x, 0.375)/0.375, 10.*(cos(_iTime)*.5 + .5));
        // x = cos(x*PI*2. + _iTime*5.)*.5 + .5;
        // x = 0.01;
        x = 0.0;
        m = (.5 + float(i))/float(maxSection);
        v = 1./float(maxSection);
        // v = 0.75;

        vec3 fm = Hei13Colormap(m, v); /* colormap value at that point */

        if(distance(mean, m) < v*.5 && distance(vari, x) < 0.01)
        {
            fragColor.rgb = vec3(0);

            if(distance(mean, m) < v*.5 - 0.005 && distance(vari, x) < 0.005)
                fragColor.rgb = fm;

            return;
        }

        float p = 0.; /* base proportion of the affected zone */

        // float tmpv = min(v, distance(mean, m));
        if(distance(mean, m)+v > vari)
        {
            // p = (v/vari)*(1.-(1/v)*distance(distance(mean, m)+v*.5, vari));
            // p = 0.;

            // p = .5-distance(distance(mean, m)+v, vari);

            p = (distance(distance(mean, m)+v, vari));
        }


        p = (.5*v - p)/vari;

        // p = min(m+v, mean+vari);


        p = (min(m+v*.5, mean+vari*.5) - max(m-v*.5, mean-vari*.5)) / (vari);

        // p = v/vari;

        p = clamp(p, 0., 1.);


        // p = v*.5 - (distance(mean, m)+v - vari);
        // p *= v/vari;

        // p = (1.-(vari-v)) * (distance(mean, m));
        // p = distance(mean, m);
        
        // p = .5*(v/vari) - (distance(distance(mean, m)+v, vari))/vari;

        // p = v/vari * linearstep(
        //         vari + v,
        //         vari,
        //         distance(mean, m)+v
        //     );


        if(v >= vari)
        {
            // p = mix(0., 1., vari/v);
            // p *= linearstep(0, v, vari);

            // p = 0.;
            // return;
        }
        
        fragColor.rgb = p.rrr;
        // return;

        c = meanExtraction(
            c, fm, p, x
        );

        // if(p <= 0.) return;


        // p = distance(mean, m);


        // return;

        // fragColor.rgb = 
        //     meanExtraction(
        //         vec3(0.5, 0.5, 0.0),
        //         vec3(1.0, 0.0, 0.0),
        //         1./2.,
        //         0.0
        //     );


        // fragColor.a = 1.-p;
        // return;

        // c = simpleColormapReduction(
        //     c, mean, vari, sizef, fm, m, x
        // );

    }

    // fragColor.rgb = vec3(vari - 2.*distance(mean, 1./3.));
    // return;


    float sm = 16.0;
    vec3 sum = vec3(0.0);
    vec3 cnt = vec3(0.0);
    for(float i = 0; i < sm; i++)
    {
        float weight = i/sm;

        sum += weight*Hei13Colormap(uv.y + uv.x*(i/sm - .5), uv.x/sm);

        cnt += weight;
    }
    fragColor.rgb = sum/cnt;

    // fragColor.rgb = c;

    // fragColor.rgb = Hei13Colormap(uv.y, 0.f);
    // fragColor.rgb = Hei13Colormap(uv.y, uv.x);
}