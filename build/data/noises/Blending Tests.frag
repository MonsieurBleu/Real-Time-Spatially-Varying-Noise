#include ../../data/noises/utils.glsl

#include functions/OKLab.glsl

#include functions/FiltrableNoises.glsl

float usmoothstep(float edge0, float edge1, float x)
{
    float t; 
    t = (x - edge0) / (edge1 - edge0);
    return t * t * (3.0 - 2.0 * t);
}

float cubicstep(float edge0, float edge1, float x)
{
    float t = (x - edge0) / (edge1 - edge0) - .5;
    return clamp(t*t*t*4. + .5, 0., 1.);
}

#define P 2.5
#define L 1.
#define S P*2.

float getPriority(
    float val,
    float avg,
    float var
)
{

    // var = sqrt(var);
    return clamp((val-avg)/(P*var), -1., 1.);
    return (val-avg)/(P*var);

    // return (val-avg)/(P*var);

    // return (val-avg)/(1.5*(avg - 0.125));

    float p = 1.75;
    return (val-avg)/(p*var);
    // return smoothstep(-p*var, p*var, val - avg) - .5;

}

#define MixMaxBlending_INVERT_BOTH -1
#define MixMaxBlending_INVERT_NONE 0
#define MixMaxBlending_INVERT_FIRST 1
#define MixMaxBlending_INVERT_SECOND 2

float PPM_MixMax(
    float noise1,
    float avg1,
    float var1,
    float noise2,
    float avg2,
    float var2,
    int invertChannel,
    float sharpness,
    float alpha
)
{

    float priority1 = getPriority(noise1, avg1, var1);
    float priority2 = getPriority(noise2, avg2, var2);

    switch(invertChannel)
    {
        case MixMaxBlending_INVERT_BOTH :
            priority1 = -priority1;
            priority2 = -priority2;
            break;
        
        case MixMaxBlending_INVERT_FIRST :
            priority1 = -priority1;
            break;

        case MixMaxBlending_INVERT_SECOND :
            priority2 = -priority2;
            break;
        
        default : break;
    }
    
    // priority1 += 2.*(alpha - .5);
    // priority2 += 2.*(.5 - alpha);

    // sharpness = clamp(1.-sharpness, 1e-6, 1.);

    /* Todo : investigate the magick number */
    float l = 2. * 1.1498268;
    // 1.414213562373095

    l = log(10.) - 0.002;
    l = tan(radians(66.5)) - 0.0001;

    l = 2.144980073;

    l = L*4.;



    // sharpness *= 2.;
    sharpness = max(sharpness, 1e-6);

    return smoothstep(-sharpness, +sharpness, 0.5*(priority2+priority1) + (sharpness + 1.)*(2.*alpha - 1.));
    // return smoothstep(-sharpness, +sharpness, mix(priority2, priority1, alpha) + (sharpness + 1.)*(2.*alpha - 1.));

    // priority1 = mix(priority1, 1.1, 1.-alpha);
    // priority2 = mix(priority2, -1.1, alpha);


    // priority1 = mix(priority1, -1.5, alpha);
    // priority1 = mix(priority1, +1.5, 1.-alpha);

    // priority1 = priority1*0.5 + 0.5;
    // priority2 = priority2*0.5 + 0.5;

    // priority1 *= alpha,
    // priority2 *= 1.-alpha;

    // priority1 = priority1*2. - 1.;
    // priority2 = priority2*2. - 1.;

    // priority2 = mix(priority1, -1.50, 1.-alpha);

    // priority1 += alpha*(priority1*(alpha - 2.) - alpha*1.5);

    // priority2 = mix(priority1, +1.0, 1.-alpha);

    // return linearstep(-sharpness, +sharpness, priority1+priority2);

    // return smoothstep(-sharpness, +sharpness, priority1+priority2);

    // sharpness *= S;

    // sharpness = 10.;
    // l = L*sharpness;
    // l = sharpness*8.;
    // sharpness = 2./sharpness;

    return linearstep(-sharpness, +sharpness, priority1+priority2 + l*(alpha - .5));
    return smoothstep(-sharpness, +sharpness, priority1+priority2 + l*(alpha - .5));
}

vec3 preservingMix(vec3 col1, vec3 avg1, vec3 col2, vec3 avg2, float alpha)
{
    // Variance preserving blending
    float ialpha = 1.-alpha;
    vec3 espf = avg1*alpha + avg2*ialpha;
    return espf + (col1*alpha + col2*ialpha - espf)/sqrt(ialpha*ialpha + alpha*alpha);
}

void main()
{
    /**** Preparing UV and stuff ****/
    UV_PREPROCESS

    auv.x /= xrange.y * 0.5;
    auv.y /= yrange.y * 0.5; 

    vec2 gridDim = vec2(2, 10);
    vec2 gridPos = vec2(floor(uv*gridDim)/(gridDim-1.));
    vec2 cellUV = (uv-gridPos*(1. - 1./gridDim))*(gridDim);

    vec2 borderEpsilon = 0.02.rr;
    if(
        cellUV.x > (1. - borderEpsilon.x) ||
        cellUV.y > (1. - borderEpsilon.y) ||
        cellUV.x < borderEpsilon.x ||
        cellUV.y < borderEpsilon.y
    )
    {
        fragColor.rgb = vec3(1); return;
    }

    cellUV /= gridDim;
    CorrectUV(cellUV, scale);
    auv = cellUV;

    /**** Cells changement pressets ****/

    float smoothness = gridPos.y*4.;





    // if(auv)
    // fragColor.rg = auv;
    // return; 

    // auv /= 5.;
    // auv -= 1.0;


    const int n = 8;

    // auv *= 0.5 + 50.*(0.5 + 0.5*cos(_iTime));
    
    float slice = 0.001;
    // slide *= pow(xrange.y, 4.0);
    // float a = (auv.x + .5)*(1.+slice) - slice*.5;
    float a = cellUV.x*(1.+slice) - slice*.5;

    // a = 1.;

    // a = cos(auv.x*5.)*0.5 + 0.5;
    // a = cnoise(auv*2).r*3.;
    // a = gradientNoise(auv*0.5);

    // auv /= pow(xrange.y, .5);

    // {
    //     // auv *= xrange.y;
    //     auv *= pow(xrange.y, 1.);

    //     float timec = _iTime;
    //     vec2  F = 0.5*vec2( 0.1, 0.1+ (0.5+0.5*cos(2.*.5*timec)));
    //     vec2  O = 0.5*vec2( 0.1, 0.1+ (0.5+0.5*sin(2.*.2*timec))*PI*2.);
    //     // Filtered local random phase noise
    //     a = filtered_local_random_phase_noise(timec*0.1 + auv*.5,5.,15,F, O)*.5 + .5;

    //     a = clamp(a, 0., 1.);
    // }

    a = clamp(a, 0., 1.);

    int smoothStepLevel = 0;
    for(int i = 0; i < smoothStepLevel; i++)
        a = smoothstep(0., 1., a);


    // a = cos(_iTime*0.5)*.5 + .5;
   

    // a = pow(a, .5);

    // a = mix(0.2, 0.8, a);

    vec3 nVorCenter;
    // vec3 nVor = voronoi3d(vec3(10.0*auv, 0), nVorCenter).rgb;

    fragColor.rgb = a.rrr;

    vec3 col[n];
    vec3 esp[n];
    vec3 var[n];

    // Classic perlin noise "camo" mode
    col[0] = 1.0 - pow(.5 + .5*cnoise(40.0 * auv * vec2(0.25, 1.0)), 2.).rrr;
    esp[0] = 0.72.rrr;
    var[0] = 0.03.rrr;

    // Classic perlin noise "gradient" mode
    col[1] = (cnoise(auv*30.0 * -vec2(0.75, 1.0)).rrr*.5 + .5);
    esp[1] = 0.5.rrr;
    var[1] = 0.0284.rrr;

    // Gradient noise
    col[2] = gradientNoise(auv*15.0).rrr;
    esp[2] = 0.5.rrr;
    var[2] = 0.007.rrr; 

    // Voronoi
    col[3] = 1.0 - voronoi3d(vec3(auv*20.0, 0), nVorCenter).rrr;
    esp[3] = 1.0 - 0.529.rrr;
    var[3] = 0.031.rrr;

    // White Noise
    col[4] = rand3to1(auv.xyy*500.0).rrr;
    esp[4] = 0.5.rrr;
    var[4] = 0.0834.rrr;

    float timec = _iTime;
    timec = 1.;
    vec2  F = 0.5*vec2( 0.1, 0.1+ (0.5+0.5*cos(2.*.5*timec)));
    vec2  O = 0.5*vec2( 0.1, 0.1+ (0.5+0.5*sin(2.*.2*timec))*PI*2.);

    // Filtered local random phase noise
    col[5] = filtered_local_random_phase_noise(auv,5.,15,F, O).rrr*0.5 + 0.5;
    // col[5] = filtered_local_random_phase_noise(auv,10.0,1,0.1*vec2(SQR3, E),0.1*vec2(PHI, SQR2)).rrr*0.5 + 0.5;
    // col[5] = clamp(col[5], vec3(0.), vec3(1.));
    esp[5] = 0.5.rrr;
    var[5] = 0.006.rrr;

    // fragColor.rgb = col[5];
    // return;

    // Filtered spike noise
    float alpha = clamp(0.25*auv.y + .75, 0., 1.);
    // a = 1.;
    alpha = 1.;
    // alpha = col[1].r;

    col[6] = FilteredSpikeNoise(auv, 0.25, 17, alpha, 4., 0., timec).rrr; 
    // col[6] = clamp(col[6], vec3(0.), vec3(1.));
    esp[6] = 0.7.rrr*alpha*alpha;
    var[6] = 0.12.rrr;


    col[7] = pow(filtered_local_random_phase_noise(auv*5. + 1.,5.,15,F, O)*0.5 + 0.5, .25).rrr;
    // col[5] = filtered_local_random_phase_noise(auv,10.0,1,0.1*vec2(SQR3, E),0.1*vec2(PHI, SQR2)).rrr*0.5 + 0.5;
    // col[7] = clamp(col[7], vec3(0.), vec3(1.));
    esp[7] = 0.83.rrr;
    var[7] = 0.001.rrr;

    // fragColor.rgb = esp[6].rrr;
    // return;

    // fragColor.rgb = col[5];
    // return;

    // int b = 2;
    // int c = 3;



    int b = 5;
    int c = 3;

    /*
        MB1     MB2     EB1     EB2   | A       MMM     EMM


        ************ MixMaxBlending_INVERT_SECOND ***********

                                            ==> 0.5     0.006
        0.7     0.5     0.12    0.006 | 0.25    0.5     0.01
        0.7     0.5     0.12    0.006 | 0.5     0.7     0.06
        0.7     0.5     0.12    0.006 | 0.75    0.7     0.12
                                            ==> 0.7     0.12

        0.7     0.5     0.12    0.006 | 0.3     0.53    0.02
        0.7     0.5     0.12    0.006 | 0.1     0.5     0.006

        0.7     0.5     0.12    0.006 | 0.7     0.7     0.12
        0.7     0.5     0.12    0.006 | 1.0     0.7     0.12


        ************ MixMaxBlending_INVERT_FIRST ***********

                                            ==> 0.5     0.006
        0.7     0.5     0.12    0.006 | 0.25    0.5     0.006
        0.7     0.5     0.12    0.006 | 0.5     0.5     0.03
        0.7     0.5     0.12    0.006 | 0.75    0.66    0.12
                                            ==> 0.7     0.12
    */

    // col[b] = clamp(col[b], vec3(0.), vec3(1.));
    // col[c] = clamp(col[c], vec3(0.), vec3(1.));

    // a = (a-0.5)*0.5 + 0.5;

    // a = 0.5;

    // var[c] *= 10.;
    // var[b] *= 10.;


    // smoothness = floor(smoothness*smoothnessStep)/smoothnessStep;
    // if(distance(smoothness, 1.-uv.y) < 0.0025) discard;

    vec3 a3 = PPM_MixMax(
        col[b].r, esp[b].r, sqrt(var[b].r),
        col[c].r, esp[c].r, sqrt(var[c].r),
        
        // col[b].x/esp[b].x < col[c].x/esp[c].x

        MixMaxBlending_INVERT_SECOND, 
        
        // .0, 
        // smoothstep(0., 1., 1.-uv.y),
        smoothness,
        a
        ).rrr;
    


    // vec3 a3test = Filtered_PPM_MixMax(
    //     esp[b].r, esp[b].r, var[b].r,
    //     esp[c].r, esp[c].r, var[c].r,
    //     // col[b].x/esp[b].x < col[c].x/esp[c].x

    //     MixMaxBlending_INVERT_SECOND, .5, a,
    //     derivative(auv*100.)*.25
    // ).rrr;

    // float lod = derivative(auv*100.)*.25;
    // a3 = mix(a3.r, a3test.r, clamp(lod, 0., 1.)).rrr;

    // a3 = mix(a3.r, smoothstep(0., 1., a), smoothstep(-3., 1., .5*length(max(dFdx(auv), dFdy(auv))))).rrr;

    // col[c] = hsv2rgb(vec3(col[c].x*0.55 + 0.9, 1., 1.));
    // col[b] = hsv2rgb(vec3(col[b].x*0.3 - 0.7, col[b].y + 0.1, 1.));
    // col[c] = clamp(col[c], vec3(0), vec3(1));
    // col[b] = clamp(col[b], vec3(0), vec3(1));

    // col[c] *= 1.5*vec3(1, 0.5, 0); esp[c] *= 1.5*vec3(1, 0.5, 0);
    // col[b] *= 1.3*vec3(0, 0.6, 1); esp[b] *= 1.3*vec3(0, 0.6, 1);

    col[c] *= vec3(1, 0, 0); esp[c] *= vec3(1, 0, 0);
    col[b] *= vec3(0, 1, 0); esp[b] *= vec3(0, 1, 0);

    // col[c] = vec3(1, 0, 0);
    // col[b] = vec3(0, 1, 0);

    // a3 = a.rrr;

    // #define OKLAB_COLOR_BLENDING

    // a3 = a.rrr;

    #ifdef OKLAB_COLOR_BLENDING
    col[c] = rgb2oklab(col[c]);
    col[b] = rgb2oklab(col[b]);
    #endif

    // Simple blending
    fragColor.rgb = mix(col[c], col[b], smoothstep(vec3(0.), vec3(1.), a3));

    // Variance preserving blending
    fragColor.rgb = preservingMix(
        col[b], esp[b],
        col[c], esp[c],
        a3.r
    );

    #ifdef OKLAB_COLOR_BLENDING
    fragColor.rgb = oklab2rgb(fragColor.rgb);
    #endif

    // int i = int(uv.y*n);

    // i = 7;

    // if(xrange.y > 2.)
    //     fragColor.rgb = col[i];
    // else
    //     fragColor.rgb = getPriority(col[i].x, esp[i].x, sqrt(var[i].x)).rrr * .5 + .5;

    if(xrange.y > 2.)
        fragColor.rgb = mix(
            vec3(1)*(getPriority(col[c].x, esp[c].x, sqrt(var[c].x)) * .5 + .5),
            vec3(1)*(getPriority(col[b].g, esp[b].g, sqrt(var[b].g)) * .5 + .5),
            a3.r
        );

    // fragColor.rgb = 0.0.rrr;
    // if(a3.r > 1e-6) fragColor.rgb = vec3(1, 0, 0);

    // fragColor.rgb = a3;

    // fragColor.rgb = getPriority(col)

    // fragColor.rgb = .5.rrr;

    // a = cubicstep(0., 1., a);
    // a = smoothstep(0., 1., a);
    // fragColor.rgb = a.rrr;
}



/*

    x² - 2ax + a² 


    x³ - 2ax² + xa²
    - ax² + 2a²x - a² 

    x³ - 3ax² + 3a²x - a³ 


    + 3x² - 6ax + 3a² 

    - 2x³ + 6ax² - 6a²x + 2a²



    -2x³ + x²(1 + 6a) - x(2a + 6a²) + a² + 2a³   

*/

/*




*/