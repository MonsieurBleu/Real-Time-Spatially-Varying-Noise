#include ../../data/noises/utils.glsl

void main()
{
    UV_PREPROCESS

    // auv *= 0.5;

    const int n = 4;

    float slice = 0.001 * pow(xrange.y, 4.0);
    float a = uv.x*(1.+slice) - slice*.5;
    
    // a = cos(auv.x*5.0)*0.5 + 0.5;

    a = clamp(a, 0., 1.);
    a = smoothstep(0., 1., a);
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
    col[3] = voronoi3d(vec3(auv*20.0, 0), nVorCenter).rrr;
    esp[3] = 0.529.rrr;
    var[3] = 0.031.rrr;

    int b = 2;
    int c = 3;
    
    col[b] = hsv2rgb(vec3(col[b].x*0.5 + 0.9, 2., 1.));
    esp[b] = vec3(0.87, 0.69, 0.0);
    var[b] = vec3(0.051, 0.1, 1e-6);

    col[c] = hsv2rgb(vec3(col[c].x*0.3 - 0.7, col[c].y + 0.1, 1.));
    esp[c] = vec3(0.37, 0.97, 0.86);
    var[c] = vec3(0.031, 0.009, 0.01);

    for(int i = 0; i < n; i++)
    {
        vec3 maxV = esp[i] + (1.0*(var[i]));
        vec3 minV = esp[i] - (1.0*(var[i]));
        // maxV = vec3(1.);

        priority1[i] = clamp((col[i]-minV)/(maxV-minV), vec3(0.), vec3(1.));
        // priority1[i] = smoothstep(minV, maxV, col[i]);
    }


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



    // a = 1;

    // a = 0.5;
    
    vec3 a3 = vec3(a);

    // Priority based-blending
    // if(false)
    {
        priority2[b] = 2.0 * vec3(a - 0.5);
        priority2[c] = - priority2[b];

        priority1[b] += 1.0*pow(priority2[b], vec3(1.0));
        priority1[c] += 1.0*pow(priority2[c], vec3(1.0));

        // a = min(priority1[b].r, 1.-priority1[c].r);
        // a = priority1[b].r;

        a3 = priority1[b] - priority1[c];
        
        a3 = a3.rrr;
        // a3 = min(a3.r, min(a3.g, a3.b)).rrr;
        // a3 = ((a3.r+a3.g+a3.b)/3.0).rrr;

        a3 = clamp(a3, 0.0.rrr, 1.0.rrr);

        // float tmpa = 2.0;
        a3 = pow(a3, 1.0.rrr - 2.0.rrr*(a3-0.0.rrr));
        // a = smoothstep(0., 1., a);
        a3 = clamp(a3, 0.0.rrr, 1.0.rrr);
    }



    // Simple blending
    fragColor.rgb = mix(col[c], col[b], a3);

    // Variance preserving blending
    vec3 ai = 1.-a3;
    vec3 espf = esp[b]*a3 + esp[c]*ai;
    fragColor.rgb = espf + (col[b]*a3 + col[c]*ai - espf)/sqrt((a3*a3 + ai*ai));


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
}