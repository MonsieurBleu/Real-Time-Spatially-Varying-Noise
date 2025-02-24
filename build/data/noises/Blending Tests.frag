#include ../../data/noises/utils.glsl

#include functions/OKLab.glsl

#include functions/FiltrableNoises.glsl

void main()
{
    UV_PREPROCESS

    auv *= 1.5;
    // auv -= 1.0;
    // auv.x /= xrange.y * 0.5;
    // auv.y /= yrange.y * 0.5; 

    // auv *= 0.25 + 5.*(0.5 + 0.5*cos(_iTime));

    const int n = 7;

    float slice = 0.001 * pow(xrange.y, 4.0);
    float a = uv.x*(1.+slice) - slice*.5;
    
    // a = cos(auv.x*5.0)*0.5 + 0.5;
    // a = cnoise(auv*2).r;

    a = clamp(a, 0., 1.);

    int smoothStepLevel = 2;
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
    vec3 priority1[n];
    vec3 priority2[n];

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
    vec2  F = 0.5*vec2( 0.1, 0.1+ (0.5+0.5*cos(2.*.5*timec)));
    vec2  O = 0.5*vec2( 0.1, 0.1+ (0.5+0.5*sin(2.*.2*timec))*PI*2.);

    // Filtered local random phase noise
    col[5] = filtered_local_random_phase_noise(auv,5.,15,F, O).rrr*0.5 + 0.5;
    // col[5] = filtered_local_random_phase_noise(auv,10.0,1,0.1*vec2(SQR3, E),0.1*vec2(PHI, SQR2)).rrr*0.5 + 0.5;
    col[5] = clamp(col[5], vec3(0.), vec3(1.));
    esp[5] = 0.5.rrr;
    var[5] = 0.006.rrr;

    // Filtered spike noise
    col[6] = FilteredSpikeNoise(auv, 0.25, 17, 1., 10., 0., timec).rrr; 
    col[6] = clamp(col[6], vec3(0.), vec3(1.));
    esp[6] = 0.4.rrr;
    var[6] = 0.12.rrr;


    // fragColor.rgb = col[6];
    // return;

    // int b = 2;
    // int c = 3;



    int b = 6;
    int c = 5;

    // col[b] = hsv2rgb(vec3(col[b].x*0.5 + 0.9, 2., 1.));
    // esp[b] = vec3(0.87, 0.69, 0.0);
    // var[b] = vec3(0.051, 0.1, 1e-6);

    // col[c] = hsv2rgb(vec3(col[c].x*0.3 - 0.7, col[c].y + 0.1, 1.));
    // esp[c] = vec3(0.37, 0.97, 0.86);
    // var[c] = vec3(0.031, 0.009, 0.01);

    for(int i = 0; i < n; i++)
    {
        vec3 maxV = esp[i] + (2.0*(var[i]));
        vec3 minV = esp[i] - (2.0*(var[i]));
        // maxV = vec3(1.);

        float alphaTest = max(abs(esp[c].x - esp[b].x), 10.*abs(var[c].x - var[b].x));
        alphaTest = clamp(alphaTest, 0, 1);
        maxV = mix(vec3(1), maxV, alphaTest);
        minV = mix(vec3(0), minV, alphaTest);

        // maxV = vec3(1);
        // minV = vec3(0);

        priority1[i] = clamp((col[i]-minV)/(maxV-minV), vec3(0.0), vec3(1.));
        // priority1[i] = smoothstep(minV, maxV, col[i]);
    }

    // a = 1.;
    // priority1[c] = cnoise(auv * 20.0).rrr;
    // priority1[b] = cnoise(auv * -50.0 + 150.).rrr;

    // col[b] = vec3(1);
    // col[c] = vec3(1);
    // esp[b] = vec3(1);
    // esp[c] = vec3(1);

    // vec3 color1 = vec3(1., 0.0, 1);
    // vec3 color2 = vec3(0.9, 0.9, 0.3);

    // col[b] *= color1;
    // esp[b] *= color1;

    // col[c] *= color2;
    // esp[c] *= color2;




    // a = abs(cos(_iTime));
    // a = 0.;
    
    vec3 a3 = vec3(a);

    // Priority based-blending
    // if(false)
    {
        priority2[b] = 2.0 * vec3(a - 0.5);
        priority2[c] = - priority2[b];

        // priority1[c] = 1 - priority1[c];
        priority1[b] = 1 - priority1[b];

        priority1[b] += 1.*pow(priority2[b], vec3(1.0));
        priority1[c] += 1.*pow(priority2[c], vec3(1.0));

        // a = min(priority1[b].r, 1.-priority1[c].r);
        // a = priority1[b].r;

        // priority1[b] = abs(priority1[b]);
        // priority1[c] = abs(priority1[c]);

        a3 = priority1[b] - priority1[c];

        if(priority1[b].x < priority1[c].x)
        {
            a3 = vec3(0);
        } 
        else
        {
            a3 = vec3(1);
        }

        float timec = 0.1 + 0.5 + 0.5*cos(_iTime*1.0);
        vec2 f = vec2(1.0);
        timec = a;
        // timec = 0.01 + 2.0*timec;
        // timec = 1./max(1.-a, 1e-3);
        // timec = clamp(timec, 1., 0.);
        timec = 1.0;
        a3 = smoothstep(-f.x*timec, f.y*timec, (priority1[b] - priority1[c]));

        // a3 = smoothstep(priority1[c].x, priority1[b].x, 0.0).rrr;


        a3 = a3.rrr;
        // a3 = min(a3.r, min(a3.g, a3.b)).rrr;
        // a3 = ((a3.r+a3.g+a3.b)/3.0).rrr;

        a3 = clamp(a3, 0.0.rrr, 1.0.rrr);

        // float tmpa = 2.0;
        // a3 = pow(a3, 1.0.rrr - 2.0.rrr*(a3-0.0.rrr));
        // a = smoothstep(0., 1., a);
        a3 = clamp(a3, 0.0.rrr, 1.0.rrr);
    }

    // priority1[b] -= 1.*pow(priority2[b], vec3(1.0));
    // priority1[c] -= 1.*pow(priority2[c], vec3(1.0));
    // col[c] = priority1[c];
    // col[b] = priority1[b];

    // return;
    /*
        0.79
        0.44

    */

    // vec3 hcorCol_B = col[b];

    // hcorCol_B -= esp[b];
    // hcorCol_B *= sqrt(var[c])/sqrt(var[b]);
    // hcorCol_B += esp[c];

    // // col[b] = mix(hcorCol_B, col[b], a);
    // col[b] = hcorCol_B;

    // if(xrange.y < 2.0)
    //     fragColor.rgb = col[b];
    // else 
    //     fragColor.rgb = col[c];
    // return;


    // a3 = a.rrr;


    // col[c] = hsv2rgb(vec3(col[c].x*0.5 + 0.9, 2., 1.));
    // col[b] = hsv2rgb(vec3(col[b].x*0.3 - 0.7, col[b].y + 0.1, 1.));
    // col[c] = clamp(col[c], vec3(0), vec3(1));
    // col[b] = clamp(col[b], vec3(0), vec3(1));
    // col[c] = vec3(1, 1, 0);
    // col[b] = vec3(0, 1, 1);

    #define OKLAB_COLOR_BLENDING
    
    #ifdef OKLAB_COLOR_BLENDING
    col[c] = rgb2oklab(col[c]);
    col[b] = rgb2oklab(col[b]);
    #endif

    // Simple blending
    fragColor.rgb = mix(col[c], col[b], a3);

    // Variance preserving blending
    vec3 ai = 1.-a3;
    vec3 espf = esp[b]*a3 + esp[c]*ai;
    // fragColor.rgb = espf + (col[b]*a3 + col[c]*ai - espf)/sqrt((a3*a3 + ai*ai));

    #ifdef OKLAB_COLOR_BLENDING
    fragColor.rgb = oklab2rgb(fragColor.rgb);
    #endif

    if(false)
    switch(int(uv.x*4.0))
    {
        case 0 : 
            fragColor.rgb = priority1[0];
            break;
        case 1 : 
            fragColor.rgb = priority1[1];
            break;
        case 2 : 
            fragColor.rgb = priority1[2];
            break;
        case 3 : 
            fragColor.rgb = priority1[3];
            break;
        break;
    }

    // fragColor.rgb = a.rrr;

    // fragColor.rgb = smoothstep(vec3(0.), vec3(1.), fragColor.rgb);

    // if(a > 1.0)
    //     fragColor.rgb = vec3(1, 0, 0);
    // else if(a < 0.)
    //     fragColor.rgb = vec3(0, 1, 0);

    // fragColor.rgb = auv.xyy;
    // fragColor.rgb = col[b];
}