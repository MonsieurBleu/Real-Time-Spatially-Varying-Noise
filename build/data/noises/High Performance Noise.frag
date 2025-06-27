#include ../../data/noises/utils.glsl


float distToHexCenter(vec2 auv, float hexSize)
{
    float yD = min(
        distance(auv.y, auv.y-mod(auv.y, hexSize))/hexSize,
        distance(auv.y, auv.y + (hexSize-mod(auv.y, hexSize)))/hexSize
    )*2.0;

    float xOff = mod(floor(auv.y/hexSize), 2.0) * hexSize*0.5;

    auv.x += xOff;

    float xaD = min(
        distance(auv.x, auv.x-mod(auv.x, hexSize))/hexSize,
        distance(auv.x, auv.x + (hexSize-mod(auv.x, hexSize)))/hexSize
    )*2.0;

    return yD * xaD;
}

vec2 projectOnLine2D(vec2 P, vec2 LinePoint, vec2 LineDir)
{
    return P + LineDir * dot(P-LinePoint, LineDir)/length(LineDir);
}


void swap(in out vec2 v1, in out vec2 v2)
{
    vec2 tmp = v1;
    v1 = v2;
    v2 = tmp;
}

void main()
{
    UV_PREPROCESS

    float hexSize = 0.025;
    auv *= 0.5;
    // auv *= 1.25;
    // + (cos(_iTime * 0.01)*0.5 + 0.5);


    float halfHexSize = hexSize * 0.5;

    // float yD = min(
    //     distance(auv.y, auv.y-mod(auv.y, hexSize))/hexSize,
    //     distance(auv.y, auv.y+(hexSize-mod(auv.y, hexSize)))/hexSize
    // )*2.0;


    /* hex grid ...*/
    // hexSize *= 0.5;

    // float xG = 2.0*distance(auv.x, round(auv.x/hexSize)*hexSize)/hexSize;
    // // hexSize /= 0.5;

    // auv.y += mod(floor(auv.x/hexSize), 2.0) * hexSize * 0.5;

    // float yG = 2.0*distance(auv.y, round(auv.y/hexSize)*hexSize)/hexSize;

    // // xG -= yG;
    // // yG -= xG*0.1;






    // float yRot = auv.y + 0.0;
    // float yG = 2.0*distance(yRot, round(yRot/hexSize)*hexSize)/hexSize;

    // // float off = hexSize*0.1;

    // // float xRot = auv.x*cos(PI*0.25) - auv.y*sin(PI*0.25);
    // // float xG = 2.0*distance(xRot, round(xRot/hexSize)*hexSize)/hexSize;

    // // float zRot = auv.x*cos(-PI*0.25) - auv.y*sin(-PI*0.25);
    // // float zG = 2.0*distance(zRot, round(zRot/hexSize)*hexSize)/hexSize;

    // vec2 hexDim = hexSize * vec2(1, SQR3);

    // vec2 closestG1 = vec2(ceil(auv.x/hexDim.x), round(auv.y/hexDim.y))*hexDim;
    // // closestG1.x = round(auv.x/hexSize)*hexSize;
    // float yG = distance(auv, closestG1)/halfHexSize;

    // vec2 closestG2 = vec2(floor(auv.x/hexDim.x), round(auv.y/hexDim.y))*hexDim;
    // float xG = distance(auv, closestG2)/halfHexSize;


    // vec2 closest = yG < xG ? closestG1 : closestG2;

    // float d = distance(closest, auv)/hexSize;
    // // d += min(yG, xG);

    // // fragColor.r = yG;
    // // fragColor.g = xG;
    // // fragColor.r = 1.0 - distance(auv, closest)/halfHexSize;
    // // fragColor.rgb = rand3to3(vec3(closest, 0)).rrr;
    // // fragColor.g = min(xG, yG);
    // fragColor.g = 1.0 - clamp(d, 0, 1);

    // float smoothD = 0.9;
    // float smoothO = 0.1;
    // // fragColor.r = smoothstep(smoothD, smoothD+smoothO, yG);
    // // fragColor.g = smoothstep(smoothD, smoothD+smoothO, d);
    // // fragColor.b = smoothstep(smoothD, smoothD+0.01, zG);










    // fragColor.r = smoothstep(0.9, 1.0, xaD);

    // fragColor.g = xaD * yD;


    // float a = distToHexCenter(auv, hexSize);
    // float b = distToHexCenter(auv + vec2(hexSize*0.5, hexSize*0.5), hexSize);
    // float c = distToHexCenter(auv - vec2(hexSize*0.5, hexSize*0.0), hexSize);



    // float smoothD = 0.2;

    // fragColor.r = smoothstep(smoothD, smoothD + 0.01, a);
    // fragColor.g = smoothstep(smoothD, smoothD + 0.01, b);
    // fragColor.b = smoothstep(smoothD, smoothD + 0.01, c);


    // fragColor.rgb = hsv2rgb(vec3(_iTime*0.1, uv.x, uv.y));

    vec2 hexDim = hexSize * vec2(1, SQR3);

    float xtmpOff = mod(ceil(auv.y/hexDim.y), 2.0) * hexDim.x;
    auv.x += xtmpOff;

    vec2 gUV = vec2(mod(auv.x, hexDim.x)/hexDim.x, mod(auv.y, hexDim.y)/hexDim.y);
    gUV.x = abs(gUV.x - mod(ceil((auv.x)/hexSize), 2.0));

    float off = gUV.x > gUV.y ? -0.5 : 0.5;
    float off2 = gUV.x > gUV.y ? 0.5 : 0.0;
    float off3 = gUV.x > gUV.y ? 0.0 : 1.0;
    float off4 = gUV.x > gUV.y ? -1.0 : 1.0;

    vec2 tip = vec2(
        floor(auv.x/(hexDim.x*2.0) + off2)*(hexDim.x*2.0) + hexDim.x*off3,
        round(auv.y/hexDim.y - off)*hexDim.y
        );

    vec2 left = vec2(
        floor(auv.x/(hexDim.x*2.0) + off2)*(hexDim.x*2.0) - hexDim.x*(1.0-off3), 
        round(auv.y/hexDim.y + off)*hexDim.y
        );

    vec2 right = vec2(
        ceil(auv.x/(hexDim.x*2.0) + off2)*(hexDim.x*2.0) - hexDim.x*(1.0-off3), 
        round(auv.y/hexDim.y + off)*hexDim.y
        );

    const vec2 lineDir = normalize(hexDim * vec2(off4, 0.33333333333));
    vec2 projT = vec2(auv.x, round(auv.y/hexDim.y - off)*hexDim.y);
    vec2 projL = projectOnLine2D(auv, left, lineDir * vec2(-1, 1));
    vec2 projR = projectOnLine2D(auv, right, lineDir);

    vec3 bCoords = 1.0 - vec3(
        distance(projT, auv),
        distance(projL, auv),
        distance(projR, auv)
    )/hexDim.y;


    tip.x -= xtmpOff;
    left.x -= xtmpOff;
    right.x -= xtmpOff;
    auv.x -= xtmpOff;

    vec2 gpos[3] = vec2[3](tip, left, right);

    // fragColor.rgb = length(bCoords.r + bCoords.g + bCoords.b).rrr;

    // hexDim *= 0.5;
    ivec2 gid[3] = ivec2[3](
        ivec2(round(tip/hexDim)), 
        ivec2(round(left/hexDim)), 
        ivec2(round(right/hexDim))
        );

    vec3 alphas;
    vec2 coords[3];

    for(int i = 0; i < 3; i++)
    {
        // gid[i].x += gid[i].y % 3;

        if((gid[i].x)%3 == (gid[i].x < 0 ? 0 : 2))
        {
            alphas[0] = bCoords[i];
            coords[0] = gpos[i];
            continue;
        }

        gid[i].x += 1;
        if((gid[i].x)%3 == (gid[i].x < 0 ? 0 : 2))
        {
            alphas[1] = bCoords[i];
            coords[1] = gpos[i];
            continue;
        }

        gid[i].x += 1;
        if((gid[i].x)%3 == (gid[i].x < 0 ? 0 : 2))
        {
            alphas[2] = bCoords[i];
            coords[2] = gpos[i];
            continue;
        }

        // fragColor.rgb = fragColor.ggg;
    }

    vec2 coordsCorectionClamp = 100.0 / hexSize.rr;
    for(int i = 0; i < 3; i++)
    {
        coords[i] = round(coords[i]*coordsCorectionClamp)/coordsCorectionClamp;
    }

    fragColor.rgb = alphas;

    vec3 tmp;

    vec3 rands[3] = vec3[3]
    (
        rand3to3(vec3(coords[0], 0))*0.,
        rand3to3(vec3(coords[1], 0))*0.,
        rand3to3(vec3(coords[2], 0))*0.
    );

    vec3 colors[3] = vec3[3](
        voronoi3d(rands[0] + vec3(10.0 * auv, 0), tmp).rrr,
        voronoi3d(rands[1] + vec3(10.0 * auv, 0), tmp).rrr,
        voronoi3d(rands[2] + vec3(10.0 * auv, 0), tmp).rrr
    );
    
    vec3 esp;
    vec3 var;

    for(int i = 0; i < 3; i++)
    {
        // if(distanceFunction(coords[i]) < 0.1)
        if(distanceFunction(coords[i]) > coords[i].x*0.5 + 0.55)
        // if(distanceFunction(coords[i]) < 0.5)
        {
            colors[i] = gradientNoise(auv*10.0 + 10.0*rands[i].x).rrr;
            esp[i] = 0.5;
            var[i] = 0.0077;

            // colors[i] = 1. - voronoi3d(vec3(100 - auv*20.0 - 10.0*rands[i].x, 0), tmp).rrr *0.6666;
            // esp[i] = 0.529 * 0.6666;
            // var[i] = 0.015;

            // colors[i] = 1.0 - (smoothstep(0.9, 1.0, 1.0 - cnoise(50.0 * auv * vec2(0.25, 1.0)))).rrr;
            // esp[i] = 0.76;
            // var[i] = 0.125;

            // colors[i] = vec3(1);

            // colors[i] = smoothstep(vec3(0.4), vec3(0.6), colors[i]);
            // esp[i] = pow(esp[i], 4.);

            // var[i] = 1;
            var[i] = 0;
            colors[i] = vec3(1);
        }
        else
        {
            colors[i] = 1.-voronoi3d(vec3(auv*20.0 - 10.0*rands[i].x, 0), tmp).rrr *0.6666;
            esp[i] = 0.529 * 0.6666;
            var[i] = 0.015;
            

            // colors[i] = rand3to1(tmp).rrr;
            // esp[i] = 0.5;

            // colors[i] = vec3(0);
            // esp[i] = 0;

            // colors[i] = 1.0 - (smoothstep(0.9, 1.0, 1.0 - cnoise(50.0 * auv * vec2(0.25, 1.0)))).rrr;
            // esp[i] = 0.76;
            // var[i] = 0.125;


            // colors[i] = (smoothstep(-0.25, 1.0, 0.75 - cnoise(10. + auv*30.0 * -vec2(0.75, 1.0)))).rrr;
            // esp[i] = 0.79;
            // var[i] = 0.056;

            var[i] = 0;
            colors[i] = vec3(0);
        }

        colors[i] = clamp(colors[i], 0, 1);
    }

    float W = sqrt(alphas[0]*alphas[0] + alphas[1]*alphas[1] + alphas[2]*alphas[2]);

    // float espSum = (esp[0] + esp[1] + esp[2])/3.0;
    float espSum = alphas[0]*esp[0] + alphas[1]*esp[1] + alphas[2]*esp[2];
    // float espSum = mix(0.5 * 1.5, 0.529 * 0.666, 0.5);
    // espSum = 0.56;

    fragColor.rgb = espSum +
        (
            (colors[0]*alphas[0]) + 
            (colors[1]*alphas[1]) + 
            (colors[2]*alphas[2])
            - espSum
        )/W
        ;

    fragColor.rgb = colors[0]*alphas[0] + colors[1]*alphas[1] + colors[2]*alphas[2];

    alphas *= alphas;
    float varf = (alphas[0]*var[0] + alphas[1]*var[1] + alphas[2]*var[2])/(W*W);

    // fragColor.rgb = varf.rrr;

    // fragColor.rgb = colors[1];

    vec3 n1 = gradientNoise(auv*10.0).rrr;;
    vec3 n2 = voronoi3d(vec3(auv*20.0, 0), tmp).rrr *0.6666;

    // fragColor.rgb = n1*.5 + n2*.5;

    // fragColor.rgb = 1.0 - (smoothstep(0.9, 1.0, 1.0 - cnoise(40.0 * auv * vec2(0.25, 1.0)))).rrr;
    // AVG = 0.45
    // VAR = 0.233

    // fragColor.rgb = (smoothstep(-0.25, 1.0, 0.75 - cnoise(auv * vec2(0.75, 1.0)))).rrr;
    // AVG = 0.7
    // VAR = 0.056
}