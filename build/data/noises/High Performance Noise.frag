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

    float hexSize = 0.1;
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

    fragColor.rgb = alphas;

    vec3 tmp;

    vec3 rands[3] = vec3[3]
    (
        rand3to3(vec3(coords[0], 0)),
        rand3to3(vec3(coords[1], 0)),
        rand3to3(vec3(coords[2], 0))
    );

    vec3 colors[3] = vec3[3](
        voronoi3d(rands[0] + vec3(10.0 * auv, 0), tmp).rrr,
        voronoi3d(rands[1] + vec3(10.0 * auv, 0), tmp).rrr,
        voronoi3d(rands[2] + vec3(10.0 * auv, 0), tmp).rrr
    );
    
    vec3 esp;

    for(int i = 0; i < 3; i++)
    {
        if(distanceFunction(coords[i]) < 0.5)
        {
            colors[i] = gradientNoise(auv*10.0).rrr;
            esp[i] = 0.5;
        }
        else
        {
            // colors[i] = voronoi3d(vec3(auv*10.0, 0), tmp).rrr;
            // esp[i] = 0.529;

            colors[i] = rand3to1(tmp).rrr;
            esp[i] = 0.5;

            // colors[i] = vec3(0);
            // esp[i] = 0;
        }
    }

    float W = alphas[0]*alphas[0] + alphas[1]*alphas[1] + alphas[2]*alphas[2];

    float espSum = (esp[0] + esp[1] + esp[2])/3.0;
    // float espSum = alphas[0]*esp[0] + alphas[1]*esp[1] + alphas[2]*esp[2];

    fragColor.rgb = espSum +
        (
            (colors[0]*alphas[0]) + 
            (colors[1]*alphas[1]) + 
            (colors[2]*alphas[2]) -
            espSum
        )/W
        ;


    // fragColor.rgb =
    //         (colors[0]*alphas[0]) + 
    //         (colors[1]*alphas[1]) + 
    //         (colors[2]*alphas[2]) 
    //     ;

    // fragColor.rgb = bCoords;

    /*

        0 0
        1 1

    */

    // vec2 tip_LEFT_BOTTOM = vec2(
    //     floor(auv.x/(hexDim.x*2.0))*(hexDim.x*2.0), 
    //     ceil(auv.y/hexDim.y)*hexDim.y
    //     );

    // fragColor.rgb = vec3(0);

    /* 

        f(x)
            y = ax + c
            y - ax - c = 0

        n(x)        
            y = -ax
            y + ax = 0
        
        c = p - n(x)A


        M : the point to project
        A : point of the Line L
        u : Direction vector of Line L
        P : projected point of M on Line L 

        P = A + dot(dot(M-A, u)/length(u), u)

    */

    // vec2 linePoint = vec2(
    //     ceil(auv.x/hexDim.x)*hexDim.x,
    //     ceil(auv.y/hexDim.y)*hexDim.y
    // );
    // vec2 lineDir = 1.0/normalize(hexDim * vec2(-1, 1));
    // vec2 proj = projectOnLine2D(auv, linePoint, lineDir);

    // vec2 linePoint2 = vec2(
    //     floor(auv.x/hexDim.x)*hexDim.x,
    //     round(auv.y/hexDim.y)*hexDim.y
    // );
    // vec2 lineDir2 = 1.0/normalize(hexDim * vec2(-1, 1));
    // vec2 proj2 = projectOnLine2D(auv, linePoint2, lineDir2);
    

    // fragColor.g = 1.0 - distance(proj, auv);
    // fragColor.b = 1.0 - distance(proj2, auv);

    // fragColor.rgb = rand3to3(vec3(seed, 1));
    // fragColor.g = max(gUV.x, gUV.y);
    // fragColor.rg = gUV;
}