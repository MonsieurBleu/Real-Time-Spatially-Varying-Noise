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

float invsmoothstep(float edge0, float edge1, float x)
{
    return .5 + sin(asin(1 - 2.*linearstep(edge1, edge0, x))/3.);
}

float P = 1.0;
float L = 1.;
float S = 1.0;
bool doLinearBlending = false;
bool doColorMapping = true;
bool showAlpha = false;
bool showPriority = false;

float getPriority(
    float val,
    float avg,
    float var
)
{
    // if(P == 0.) return val*2. - 1.;

    var = sqrt(var);
    return clamp((val-avg)/(var), -1., 1.);
    return (val-avg)/(P*var);

    // return (val-avg)/(P*var);

    // return (val-avg)/(1.5*(avg - 0.125));

    float p = 1.75;
    return (val-avg)/(p*var);
    // return smoothstep(-p*var, p*var, val - avg) - .5;

}

#define MixMaxBlending_INVERT_NONE 0
#define MixMaxBlending_INVERT_FIRST 1
#define MixMaxBlending_INVERT_SECOND 2
#define MixMaxBlending_INVERT_BOTH 3

vec3 qua1;
vec3 qua2;

float quartileEgalisation(float v, vec3 q, vec2 minmax)
{
    v = clamp(v, minmax.x, minmax.y);

    // if(v < q.y)
    // {
    //     v = linearstep(minmax.x, q.y, v)*.5;
    // }
    // else
    // {
    //     v = linearstep(q.y, minmax.y, v)*.5 + .5;
    // }

    if(v < q.x)
    {
        v = linearstep(minmax.x, q.x, v)*.25;
    }
    else if(v < q.y)
    {
        v = linearstep(q.x, q.y, v)*.25 + .25;
    }
    else if(v < q.z)
    {
        v = linearstep(q.y, q.z, v)*.25 + .5;
    }
    else 
    {
        v = linearstep(q.z, minmax.y, v)*.25 + .75;
    }

    return v*2. - 1.;
}

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

    // priority1 = quartileEgalisation(noise1, qua1, vec2(0, 1));
    // priority2 = quartileEgalisation(noise2, qua2, vec2(0, 1));

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

    sharpness = max(sharpness*.5, 0.00);


    // S = 1.0 * sharpness;
    // S += sharpness;
    // S = 0.0;



    float S2 = sharpness + S;
    // S2 = sharpness;

    
    // return smoothstep(-sharpness, +sharpness, 0.5*(priority2+priority1) + S2*alpha);
    // return linearstep(-sharpness, +sharpness, 0.5*(priority2+priority1) + S2*(2.*alpha - 1.));

    // priority1 -= alpha;

    // S2 = sharpness + .5*(abs(priority2)+abs(priority1));




    alpha = 2.*alpha - 1.;
    // return linearstep(-sharpness, +sharpness, 0.5*(priority2+priority1) + S*alpha*(sharpness + .5*(abs(priority2)+abs(priority1))));




    // S2 = linearstep(0.0, 0.75, .5*(abs(priority2)+abs(priority1)));
    // float t = linearstep(-sharpness, +sharpness, 0.5*(priority2+priority1) + S*alpha*(sharpness + S2));

    // if(alpha > 0.5)
    //     priority1 += sqrt(max(alpha*2., 0) - .75) - .5;
    // else 
    //     priority2 += sqrt(max((alpha+.5), 0) - .75) - .5;

    // priority1 = priority1*.5 + .5;
    // priority2 = priority2*.5 + .5;

    // alpha = alpha < 0.5 ? alpha : 1. - alpha; 

    // alpha = cubicstep(0., 1., alpha);
    // sharpness *= .5;

    // alpha = mix(alpha, .5, 1.-distance(alpha, .5)*2.);

    // S2 = sharpnesslinearstep(0.0, 0.75, .5*(abs(priority2)+abs(priority1)));

    // S2 = (sharpness + .5*(abs(priority2)+abs(priority1)));

    //     if(alpha > 0.5)
    // priority1 += 2.*(S2)*(1. - sqrt(1. - alpha)*SQR2);
    //     else
    // priority1 -= 2.*(S2)*(1. - sqrt(alpha)*SQR2);

    // priority1 += sign(alpha-.5)*2.*(S2)*(1. - sqrt(.5 - abs(alpha-.5))*SQR2);

    // float t = priority1 >= priority2 ? 1. : 0.;

    float psum = .5*(abs(priority2)+abs(priority1));

    float t = linearstep(
        -sharpness, 
        +sharpness, 
            0.5*(priority1+priority2) 
            + 
                // sign(alpha)*(1. - sqrt(1. - abs(alpha)))
                alpha
                *(sharpness + psum)
        )
        ;

    // t = min(t, alpha*.5 + .5);
    // t += alpha;

    // for(int i = 0; i < 50; i++)
    //     t = smoothstep(0., 1., t);


    if(P != 0.)
        t = mix(
            t, 
            invsmoothstep(0., 1., t),
            clamp(psum/sharpness, 0., 1.)
        );

    return t;
    return smoothstep(0., 1., t);
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

    // auv.x /= xrange.y * 0.5;
    // auv.y /= yrange.y * 0.5; 
    
    vec2 gridPos = vec2(floor(uv*gridSize)/(gridSize-1.));
    vec2 cellUV = (uv-gridPos*(1. - 1./gridSize))*(gridSize);

    if(gridSize.x <= 1){gridPos.x = 0.; cellUV.x = uv.x;}
    if(gridSize.y <= 1){gridPos.y = 0.; cellUV.y = uv.y;}

    float gridRatio = gridSize.y/gridSize.x;

    vec2 borderEpsilon = 0.02.rr;
    borderEpsilon.y *= gridRatio;

    fragColor.a = min(
        min(
            smoothstep(1.-borderEpsilon.x, 1.-1.5*borderEpsilon.x, cellUV.x),
            smoothstep(borderEpsilon.x, 1.5*borderEpsilon.x, cellUV.x)
        ),

        min(
            smoothstep(1.-borderEpsilon.y, 1.-1.5*borderEpsilon.y, cellUV.y),
            smoothstep(borderEpsilon.y, 1.5*borderEpsilon.y, cellUV.y)
        )
    );
    
    borderEpsilon *= 1.33;
    float border = 1.- min(
        min(
            smoothstep(1.-borderEpsilon.x, 1.-1.5*borderEpsilon.x, cellUV.x),
            smoothstep(borderEpsilon.x, 1.5*borderEpsilon.x, cellUV.x)
        ),

        min(
            smoothstep(1.-borderEpsilon.y, 1.-1.5*borderEpsilon.y, cellUV.y),
            smoothstep(borderEpsilon.y, 1.5*borderEpsilon.y, cellUV.y)
        )
    );

    // fragColor.a = 1.;
    // border = 0.;
    

    // fragColor.a = smoothstep(borderEpsilon.x, 1.5*borderEpsilon.x, cellUV.x);

    float slice = 0.1;
    float a = (cellUV.x)*(1.+slice) - slice*.5;
    vec2 cellUVScaled = cellUV;
    cellUV /= gridSize;

    /**** Cells changement pressets ****/

    // auv /= gridPos.x*.75 + 0.1;
    // auv /= 2;
   
    // a = 0.25 + 0.5*gridPos.y;
    // a = 0.25 + gridPos.x*0.5;
    a = gridPos.x;
    // a = cos(_iTime)*.5 + .5;
    // a = a*.5 + .5;
    // a = 0.5;
    // a = 0.25 + cellUV.x*0.5*gridSize.x;
    // P = gridPos.x*4.;

    // doLinearBlending = gridPos.x == 0;

    // showPriority = gridPos.y != 0.;
    // showPriority = cellUVScaled.y < .75;
    // showPriority = true;
    // if(distance(cellUVScaled.y, 0.75) < 0.005){fragColor.rgb = vec3(0); return;};

    // showAlpha = true;
    // showAlpha = gridPos.x == 1.;

    float smoothness = gridPos.y;
    // smoothness = 0.00001;
    smoothness = max(smoothness, 0.05);
    // smoothness = 0.05 + gridPos.y*0.95;
    // smoothness += 0.05;
    // smoothness = gridPos.x;
    // smoothness = cos(_iTime)*.5 + .5;
    // smoothness = cellUVScaled.x - mod(cellUVScaled.x, 0.25);
    // if(mod(cellUVScaled.x, 0.25) < 0.012){fragColor.rgb = vec3(0); return;};

    // S = pow(2., gridPos.x*gridSize.x);
    // gridPos.x = cos(_iTime)*.5 + .5;
    // S = 1./max(gridPos.x, 1e-1);
    S = 1.0;

    // P = .5 + (1.-gridPos.y)*4.0;
    // P = .25 + (1.-gridPos.y)*2.0;
    // P = .5 + (1.-gridPos.y) * gridSize.y;
    // P = a*10.0;
    // P = 1.0;
    // P = 0.;
    // P = gridPos.y;
    // P = gridPos.x;
    // smoothness = 0.0;

    int blendingMode = int(round(gridPos.x*3));
    blendingMode = MixMaxBlending_INVERT_BOTH;

    // doLinearBlending = cellUVScaled.y < 0.5;
    doColorMapping = cellUVScaled.y < 0.5;
    if(distance(cellUVScaled.y, 0.5) < 0.005){fragColor.rgb = vec3(0); return;};

    // doColorMapping = cellUVScaled.x > cellUVScaled.y;
    // if(distance(cellUVScaled.y, cellUVScaled.x) < 0.005){fragColor.rgb = vec3(0); return;};


    // doColorMapping = cellUVScaled.x < 0.5;
    // doColorMapping = false;
    // if(distance(cellUVScaled.x, 0.5) < 0.005){fragColor.rgb = vec3(0); return;};

    // doColorMapping = gridPos.x != 0.;
    // doColorMapping = cellUVScaled.y < 0.5;

    // if(cellUVScaled.y < 0.5)
    // {
    //     cellUV.y += 0.5 / gridSize.y;
    //     cellUVScaled += 0.5;
    // }





    int b = 7;
    int c = 3;
    int d = 0;
    // ivec2[3] noisePairs = ivec2[3](ivec2(3, 2), ivec2(3, 7), ivec2(7, 2));
    // b = noisePairs[min(2, int(floor(gridPos.y*3)))].x;
    // c = noisePairs[min(2, int(floor(gridPos.y*3)))].y;

    // b = 1 + int(floor(gridPos.x*gridSize.x));
    // b = 1 + int(floor(gridPos.y*gridSize.y));


    vec2 cellUVAR = cellUV;
    CorrectUV(cellUVAR, scale);
    auv = cellUVAR;
    auv *= xrange.y;
    auv *= 1.5;
    // auv *= 3.;
    // auv *= .1 + (cos(_iTime)*.5 + .5)*10.;
    // if(cellUVScaled.y > 0.5) auv *= 20.0;

    

    vec3 scales = vec3(1., 100, 100e3);
    // auv *= scales[int(floor(gridPos.x*gridSize.x))];
    // auv *= scales.z;
    // auv *= pow(6.0, 1.);

    // if(a > 1. || a < 0.)
    // {
    //     fragColor.rgb = vec3(0, 0, 1); return;
    // }
    // fragColor.rgb = a.rrr; return;


    // if(auv)
    // fragColor.rg = auv;
    // return; 

    // auv -= 1.0;



    // auv *= 0.5 + 50.*(0.5 + 0.5*cos(_iTime));
    


    // a = cos(auv.x*5.)*0.5 + 0.5;
    // a = cnoise(auv*2).r*3.;
    // a = gradientNoise(auv*0.5);

    // auv /= pow(xrange.y, .5);

    // {
    //     // auv *= xrange.y;
    //     // auv *= pow(xrange.y, 1.);
    //     // auv *= 5.0;
    //     // auv *= 5.0 + 200.f*(cos(_iTime)*0.5 + 0.5);

    //     float timec = 0.;
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

    // a = 0.5;

    // a = cos(_iTime*0.5)*.5 + .5;
   

    // a = pow(a, .5);

    // a = mix(0.2, 0.8, a);

    vec3 nVorCenter;
    // vec3 nVor = voronoi3d(vec3(10.0*auv, 0), nVorCenter).rgb;

    fragColor.rgb = a.rrr;

    const int n = 9;
    vec3 col[n];
    vec3 esp[n];
    vec3 var[n];
    vec3 qua[n];

    // Classic perlin noise "camo" mode
    col[0] = 1.0 - pow(.5 + .5*cnoise(40.0 * auv + 1e2), 2.).rrr;
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
    qua[3] = vec3(0.35, 0.47, 0.60);

    // White Noise
    col[4] = rand3to1(auv.xyy*500.0).rrr;
    esp[4] = 0.5.rrr;
    var[4] = 0.0834.rrr;
    qua[4] = vec3(.25, .5, .75);

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
    qua[5] = vec3(0.45, 0.50, 0.55);

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


    col[7] = pow(filtered_local_random_phase_noise(auv*5. + 1.,5.,15,F, O)*0.5 + 0.5, .5).rrr;
    // col[5] = filtered_local_random_phase_noise(auv,10.0,1,0.1*vec2(SQR3, E),0.1*vec2(PHI, SQR2)).rrr*0.5 + 0.5;
    // col[7] = clamp(col[7], vec3(0.), vec3(1.));

    esp[7] = sqrt(0.5).rrr;
    // esp[7] -= gridPos.y * gridSize.y * 0.0003;

    var[7] = 0.003.rrr;

    
    col[8] = 1.0 - voronoi3d(vec3(rotate(auv, vec2(PHI), PI/3.)*30., 0), nVorCenter).rrr;
    esp[8] = 1.0 - 0.529.rrr;
    var[8] = 0.031.rrr;

    // fragColor.rgb = col[8].rrr;
    // return;

    // fragColor.rgb = col[3];
    // float mm = 0.0;
    // fragColor.rgb = quartileEgalisation(col[3].r, qua[3], vec2(mm, 1.-mm)).rrr;
    // return;

    // int b = 2;
    // int c = 3;

    qua1 = qua[b];
    qua2 = qua[c];


    // showPriority = true;
    // P = 3.0;
    // col[b] += .2; esp[b] += .2;



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
        blendingMode, 
        smoothness,
        a
        ).rrr;

    if(doLinearBlending)
        a3 = a.rrr;
    

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

    if(doColorMapping)
    {
        // col[c] = hsv2rgb(vec3(col[c].x*0.55 + 0.9, 1., 1.));
        // col[b] = hsv2rgb(vec3(col[b].x*0.3 - 0.7, col[b].y + 0.1, 1.));
        // col[c] = clamp(col[c], vec3(0), vec3(1));
        // col[b] = clamp(col[b], vec3(0), vec3(1));

        // col[c] *= 1.3*vec3(0.5, 1, 0); esp[c] *= 1.3*vec3(0.5, 1, 0);
        // col[b] *= 1.3*vec3(1, 0, 0.6); esp[b] *= 1.3*vec3(1, 0, 0.6);

        col[c] *= 1.5*vec3(1, 0.5, 0); esp[c] *= 1.5*vec3(1, 0.5, 0);
        col[b] *= 1.3*vec3(0, 0.6, 1); esp[b] *= 1.3*vec3(0, 0.6, 1);

        // col[c] *= vec3(1, 0, 0); esp[c] *= vec3(1, 0, 0);
        // col[b] *= vec3(0, 1, 0); esp[b] *= vec3(0, 1, 0);
        // col[d] *= vec3(0, 0, 1); esp[b] *= vec3(0, 0, 1);

        // col[c] = vec3(1, 0, 0);
        // col[b] = vec3(0, 1, 0);
    }

    // a3 = a.rrr;

    // #define OKLAB_COLOR_BLENDING


    #ifdef OKLAB_COLOR_BLENDING
    col[c] = rgb2oklab(col[c]);
    col[b] = rgb2oklab(col[b]);
    #endif

    // Simple blending
    fragColor.rgb = mix(col[c], col[b], a3);

    // Variance preserving blending
    // fragColor.rgb = preservingMix(
    //     col[b], esp[b],
    //     col[c], esp[c],
    //     a3.r
    // );

    // if(d >= 0)
    // {
    //     float a2 = PPM_MixMax(
    //         col[d].b, esp[d].b, sqrt(var[d].b),
            
    //         fragColor.r, 
    //         mix(esp[c].r, esp[b].g, a3.r),
    //         mix(sqrt(var[c].r), sqrt(var[b].g), a3.r),
    //         blendingMode, 
    //         smoothness,
    //         // cellUV.y
    //         .25 + .5*gridPos.y
    //         );

    //     fragColor.rgb = preservingMix(
    //         col[d], esp[d],
    //         fragColor.rgb, mix(esp[c], esp[b], a3),
    //         a2.r
    //     );

    //     // fragColor.rgb = mix(fragColor.rgb, col[d], a2);
    // }

    #ifdef OKLAB_COLOR_BLENDING
    fragColor.rgb = oklab2rgb(fragColor.rgb);
    #endif

    // int i = int(uv.y*n);

    // i = 7;

    // if(xrange.y > 2.)
    //     fragColor.rgb = col[i];
    // else
    //     fragColor.rgb = getPriority(col[i].x, esp[i].x, sqrt(var[i].x)).rrr * .5 + .5;

    // if(xrange.y > 2.)

    // float segmentPosition = 0.75;
    float segmentPosition = 0.0;
    if(showAlpha && cellUVScaled.y > segmentPosition)
    {
        if(cellUVScaled.y < segmentPosition + 0.01)
        {
            fragColor.rgb = vec3(0); return;
            // discard;
        }


        fragColor.rgb = a3;

        // fragColor.rgb = a.rrr;
    }


    if(showPriority)
        fragColor.rgb = mix(
            vec3(1)*(getPriority(col[c].r, esp[c].r, sqrt(var[c].r)) * .5 + .5),
            vec3(1)*(getPriority(col[b].g, esp[b].g, sqrt(var[b].g)) * .5 + .5),
            a3.r
        );

    // fragColor.rgb = 0.0.rrr;
    // if(a3.r < 1.-1e-6) fragColor.rgb = vec3(1, 0, 0);
    // if(a3.r > 1.-1e-1) fragColor.rgb = vec3(1, 0, 0);

    // fragColor.rgb = a3;

    // fragColor.rgb = getPriority(col)

    // fragColor.rgb = .5.rrr;

    // a = cubicstep(0., 1., a);
    // a = smoothstep(0., 1., a);
    // fragColor.rgb = a.rrr;

    // fragColor.rgb *= 0.1;

    // fragColor.r = col[b].r;

    // P = 1.0;
    // fragColor.g = (getPriority(col[b].g, esp[b].g, sqrt(var[b].g)) * .5 + .5);

    // P = 0.93;
    // fragColor.b = (getPriority(col[b].g, esp[b].g, sqrt(var[b].g)) * .5 + .5);

    fragColor.rgb = mix(fragColor.rgb, vec3(0.1), border);


    // P = 0.;
    // vec3 b3 = PPM_MixMax(
    //     col[b].r, esp[b].r, sqrt(var[b].r),
    //     col[c].r, esp[c].r, sqrt(var[c].r),
    //     blendingMode, 
    //     smoothness,
    //     a
    //     ).rrr;
    
    // fragColor.rgb = abs(a3.rrr - b3.rrr);
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