#include ../../data/noises/utils.glsl

#include functions/OKLab.glsl

#include functions/FiltrableNoises.glsl

float getPriority(
    float val,
    float avg,
    float var
)
{
    float statisticsImportance = clamp(1. - sqrt(var), 0., 1.);

    // statisticsImportance = 1.0;

    float maxV = mix(1., avg + sqrt(var), statisticsImportance);
    float minV = mix(0., avg - sqrt(var), statisticsImportance);

    return clamp((val-minV)/(maxV-minV), 0., 1.);
}


float NaturalBlendingAlpha1D(
    float noise1,
    float avg1,
    float var1,
    float noise2,
    float avg2,
    float var2,
    bool invertTransition,
    float sharpness,
    float alpha
)
{

    float priority1 = getPriority(noise1, avg1, var1);
    float priority2 = getPriority(noise2, avg2, var2);

    if(invertTransition)
        priority1 = 1.-priority1;
    else
        priority2 = 1.-priority2;
    
    priority1 += 2.*(alpha - .5);
    priority2 += 2.*(.5 - alpha);

    sharpness = clamp(1.-sharpness, 1e-4, 1.);

    return smoothstep(-sharpness, +sharpness, priority1-priority2);
}

void main()
{
    UV_PREPROCESS

    // auv *= 0.5;
    // auv -= 1.0;
    // auv.x /= xrange.y * 0.5;
    // auv.y /= yrange.y * 0.5; 


    const int n = 7;

    auv *= 0.5 + 50.*(0.5 + 0.5*cos(_iTime));
    
    float slice = 0.001 * pow(xrange.y, 4.0);
    float a = (auv.x + .5)*(1.+slice) - slice*.5;
    
    // a = cos(auv.x*5.)*0.5 + 0.5;
    // a = cnoise(auv*2).r*3.;
    a = gradientNoise(auv*0.5);

    {
        float timec = 0.1;
        vec2  F = 0.5*vec2( 0.1, 0.1+ (0.5+0.5*cos(2.*.5*timec)));
        vec2  O = 0.5*vec2( 0.1, 0.1+ (0.5+0.5*sin(2.*.2*timec))*PI*2.);
        // Filtered local random phase noise
        a = filtered_local_random_phase_noise(auv*.5,5.,15,F, O)*.5 + .5;

        a = clamp(a, 0., 1.);
    }

    a = clamp(a, 0., 1.);

    int smoothStepLevel = 0;
    for(int i = 0; i < smoothStepLevel; i++)
        a = smoothstep(0., 1., a);


    // a = 1.;

    // a = pow(a, .5);

    // a = mix(0.2, 0.8, a);

    vec3 nVorCenter;
    // vec3 nVor = voronoi3d(vec3(10.0*auv, 0), nVorCenter).rgb;

    fragColor.rgb = a.rrr;

    vec3 col[n];
    vec3 esp[n];
    vec3 var[n];

    // Classic perlin noise "camo" mode
    col[0] = 1.0 - (smoothstep(0.9, 1.0, 1.0 - cnoise(40.0 * auv * vec2(0.25, 1.0)))).rrr;
    esp[0] = 0.76.rrr;
    var[0] = 0.23.rrr;

    // Classic perlin noise "gradient" mode
    col[1] = (smoothstep(-0.25, 1.0, 0.75 - cnoise(auv*30.0 * -vec2(0.75, 1.0)))).rrr;
    esp[1] = 0.79.rrr;
    var[1] = 0.057.rrr;

    // Gradient noise
    col[2] = gradientNoise(auv*10.0).rrr;
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
    timec = 0.;
    vec2  F = 0.5*vec2( 0.1, 0.1+ (0.5+0.5*cos(2.*.5*timec)));
    vec2  O = 0.5*vec2( 0.1, 0.1+ (0.5+0.5*sin(2.*.2*timec))*PI*2.);

    // Filtered local random phase noise
    col[5] = filtered_local_random_phase_noise(auv,5.,15,F, O).rrr*0.5 + 0.5;
    // col[5] = filtered_local_random_phase_noise(auv,10.0,1,0.1*vec2(SQR3, E),0.1*vec2(PHI, SQR2)).rrr*0.5 + 0.5;
    col[5] = clamp(col[5], vec3(0.), vec3(1.));
    esp[5] = 0.5.rrr;
    var[5] = 0.006.rrr;

    // fragColor.rgb = col[5];
    // return;

    // Filtered spike noise
    float alpha = clamp(0.025*auv.y + .75, 0., 1.);
    // a = 1.;
    // alpha = 1.;
    // alpha = col[1].r;
    col[6] = FilteredSpikeNoise(auv, 0.25, 17, alpha, 4., 0., timec).rrr; 
    col[6] = clamp(col[6], vec3(0.), vec3(1.));
    esp[6] = 0.7.rrr*alpha*alpha;
    var[6] = 0.12.rrr;

    // fragColor.rgb = esp[6].rrr;
    // return;

    // fragColor.rgb = col[6];
    // return;

    // int b = 2;
    // int c = 3;



    int b = 6;
    int c = 5;

    col[b] = clamp(col[b], vec3(0.), vec3(1.));
    col[c] = clamp(col[c], vec3(0.), vec3(1.));

    vec3 a3 = NaturalBlendingAlpha1D(
        col[b].r, esp[b].r, var[b].r,
        col[c].r, esp[c].r, var[c].r,
        // col[b].x/esp[b].x < col[c].x/esp[c].x
        true
        , .85, a
    ).rrr;

    a3 = mix(a3.r, smoothstep(0., 1., a), smoothstep(-3., 1., .5*length(max(dFdx(auv), dFdy(auv))))).rrr;

    // col[c] = hsv2rgb(vec3(col[c].x*0.55 + 0.9, 1., 1.));
    // col[b] = hsv2rgb(vec3(col[b].x*0.3 - 0.7, col[b].y + 0.1, 1.));
    // col[c] = clamp(col[c], vec3(0), vec3(1));
    // col[b] = clamp(col[b], vec3(0), vec3(1));
    col[c] *= vec3(0, 0, 1);
    col[b] *= vec3(0, 1, 0);

    #define OKLAB_COLOR_BLENDING
    
    #ifdef OKLAB_COLOR_BLENDING
    col[c] = rgb2oklab(col[c]);
    col[b] = rgb2oklab(col[b]);
    #endif

    // Simple blending
    fragColor.rgb = mix(col[c], col[b], smoothstep(vec3(0.), vec3(1.), a3));

    // Variance preserving blending
    vec3 ai = 1.-a3;
    vec3 espf = esp[b]*a3 + esp[c]*ai;
    // fragColor.rgb = espf + (col[b]*a3 + col[c]*ai - espf)/sqrt((a3*a3 + ai*ai));

    #ifdef OKLAB_COLOR_BLENDING
    fragColor.rgb = oklab2rgb(fragColor.rgb);
    #endif

    // int i = int(uv.y*n);
    // fragColor.rgb = getPriority(col[i].x, esp[i].x, var[i].x).rrr;

}