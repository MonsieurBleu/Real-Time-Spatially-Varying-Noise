#include ../../data/noises/utils.glsl

float squaredDistance(vec2 a, vec2 b)
{
    return (a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y);
}

void main()
{
    UV_PREPROCESS
    
    auv *= 0.25;
    // auv *= 10.0;

    float hexSize = 0.1;
    vec2 hexDim = hexSize * vec2(1, SQR3);
    // hexDim = vec2(hexSize);
    vec2 halfDim = hexDim*0.5;

    // float xtmpOff = mod(round(auv.y/halfDim.y), 2.0) * hexDim.x;
    // auv.x += xtmpOff*0.5;

    vec2 c = round(auv/hexDim)*hexDim;
    vec2 halfDimM = vec2(halfDim.x, -halfDim.y);
    

    float[5] ds = float[5]
    (
        distance(auv, c)/hexSize,
        distance(auv, c + halfDim)/hexSize,
        distance(auv, c - halfDim)/hexSize,
        distance(auv, c + halfDimM)/hexSize,
        distance(auv, c - halfDimM)/hexSize
    );

    float dmin = ds[0];

    for(int i = 1; i < 5; i++)
    {
        dmin = min(dmin, ds[i]);
    }

    float dmin2 = 1e6;
    for(int i = 0; i < 5; i++)
    {
        if(ds[i] > dmin)
            dmin2 = min(dmin2, ds[i]);
    }

    float dmin3 = 1e6;
    for(int i = 0; i < 5; i++)
    {
        if(ds[i] > dmin2)
            dmin3 = min(dmin3, ds[i]);
    }

    fragColor.rgb = 1.0 - vec3(dmin, dmin2, dmin3);
    // return;

    {
        dmin = 1.0;
        dmin2 = 1.0;
        dmin3 = 1.0;
        // hexDim.y *= 0.5;
        vec2 cmin = round(auv/hexDim)*hexDim;
        dmin = distance(auv, cmin)/hexSize;

        vec2 off = halfDim * (1.0 - 2.0*step(mod(auv, hexDim)/hexDim, vec2(0.5)));
        vec2 auv2 = auv + off;
        vec2 cmin2 = round(auv2/hexDim)*hexDim;
        dmin2 = distance(auv2, cmin2)/hexSize;

        vec2 auv3 = auv + vec2(off.x, 0)*2.0;
        vec2 cmin3 = round(auv3/hexDim)*hexDim;
        // dmin3 = distance(auv3, cmin3)/hexSize;


        // dmin2 = distance(auv, ceil(auv/halfDim)*halfDim)/hexSize;

        // dmin3 = distance(auv, floor(auv/halfDim)*halfDim)/hexSize;


        dmin  = 1.0 - dmin;
        dmin2 = 1.0 - dmin2;
        dmin3 = 1.0 - dmin3;

        // dmin = clamp(dmin, 0, 1);
        // dmin2 = clamp(dmin2, 0, 1);

        // dmin  = smoothstep(0, 1, dmin);
        // dmin2 = smoothstep(0, 1, dmin2);
        // dmin3 = smoothstep(0, 1, dmin3);


        vec3 color1 = rand3to3(cmin.xyy);
        vec3 color2 = rand3to3(cmin2.xyy - off.xyy);
        vec3 color3 = rand3to3(cmin3.xyy - (vec2(hexDim.x, 0)).xyy);

        if(dmin > dmin2)
        {
            fragColor.rgb = color1;
            dmin = 1.0 - dmin2 - dmin3;
            // fragColor.rgb = mix(color2, color1, dmin);

            // fragColor.a = smoothstep(0, 1, dmin);
        }
        else
        {
            fragColor.rgb = color2;
            dmin2 = 1.0 - dmin - dmin3;
            // fragColor.rgb = mix(color1, color2, dmin2);
            // fragColor.a = smoothstep(0, 1, dmin2);
        }

        // fragColor.rgb = dmin2*color2 + dmin*color1 + dmin3*color3;
        fragColor.rgb = dmin2*color2 + dmin*color1;
        // fragColor.a = dmin3;
        // fragColor.rgb = dmin3.rrr;

        // fragColor.rgb = vec3(dmin, dmin2, dmin3);
        // fragColor.rgb = 1.0 - min(1.0-dmin, 1.0-dmin2).rrr;
        // fragColor.rgb = (dmin+dmin2).rrr;

        // fragColor.rgb = dmin*color1;
        // fragColor.rgb *= 1.5;
    }



    // dmin /= 5.0;

    // float dmin = min(
    //     min(
    //         squaredDistance(auv, c + halfDim), 
    //         squaredDistance(auv, c - halfDim)
    //     ),
    //     min(
    //         squaredDistance(auv, c + halfDimM), 
    //         squaredDistance(auv, c - halfDimM)
    //     )
    // );

    // dmin = sqrt(min(dmin, squaredDistance(auv, c)))/(hexSize);

    // float dmin = min(
    //     distance(auv, c),
    //     distance(auv, c + hexDim*0.5)
    // );
    
    // dmin = min(
    //     dmin,
    //     distance(auv, c - hexDim*0.5)
    // );

    // dmin = min(
    //     dmin,
    //     distance(auv, c + 0.5*hexDim*vec2(1, -1))
    // );

    // dmin = min(
    //     dmin,
    //     distance(auv, c + 0.5*hexDim*vec2(-1, 1))
    // );


    // fragColor.rgb = 1.0 - vec3(dmin, dmin2, dmin3);
    // fragColor.rgb = 1.0 - dmin.rrr;

    auv *= 15.0;
    // if(false)
    {
        float size = 0.1;

        // size = 0.5 * (cos(_iTime)*0.5 + 0.5);

        vec2 c1 = ceil(auv/size)*size;
        vec2 c2 = floor(auv/size)*size;
        vec2 c3 = vec2(c1.x, c2.y);
        vec2 c4 = vec2(c2.x, c1.y);

        vec3 color1 = rand3to3(c1.xyy);
        vec3 color2 = rand3to3(c2.xyy);
        vec3 color3 = rand3to3(c3.xyy);
        vec3 color4 = rand3to3(c4.xyy);

        float d1 = 1.0 - distance(auv, c1)/size;
        float d2 = 1.0 - distance(auv, c2)/size;
        float d3 = 1.0 - distance(auv, c3)/size;
        float d4 = 1.0 - distance(auv, c4)/size;

        d1 = clamp(d1, 0, 1);
        d2 = clamp(d2, 0, 1);
        d3 = clamp(d3, 0, 1);
        d4 = clamp(d4, 0, 1);

        d1 = smoothstep(0, 1, d1);
        d2 = smoothstep(0, 1, d2);
        d3 = smoothstep(0, 1, d3);
        d4 = smoothstep(0, 1, d4);

        // fragColor.rgb = vec3(d1, d2, d3);
        fragColor.rgb = 
            ( color1*d1 
            + color2*d2 
            + color3*d3 
            + color4*d4
            )
            /(d1 + d2 + d3 + d4)
        ;

        // fragColor.rgb = pow(fragColor.rgb, 1.0 - 2.0*(fragColor.rgb - vec3(0.5)));

        // fragColor.rgb = pow(
        //     fragColor.rgb, 
        //     1.0 - 1.5*(fragColor.rgb - vec3(0.5))
        //     )
        //     // + pow((1.0 - fragColor.rgb), vec3(5.0))
        //     ;

        fragColor.rgb = smoothstep(vec3(0.), vec3(1.0), fragColor.rgb);

        // fragColor.rgb = rand3to3((round(auv/size)*size).xyy);

        // fragColor.rgb = rand3to3(auv.xyy*100.0);

        

        // fragColor.rgb = d4.rrr;
    }
}