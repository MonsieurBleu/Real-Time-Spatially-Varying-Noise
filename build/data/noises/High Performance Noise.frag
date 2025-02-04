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

    float hexSize = 0.25;
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
    vec2 seed = vec2(0);   

    auv.x += mod(ceil(auv.y/hexDim.y), 2.0) * hexDim.x;

    // seed = round(auv/hexSize)*hexSize;

    vec2 gUV = vec2(mod(auv.x, hexDim.x)/hexDim.x, mod(auv.y, hexDim.y)/hexDim.y);

    gUV.x = abs(gUV.x - mod(ceil((auv.x)/hexSize), 2.0));

    seed = gUV.x > gUV.y ? vec2(1.0) : vec2(0.0);


    float off = gUV.x > gUV.y ? -0.5 : 0.5;
    float off2 = gUV.x > gUV.y ? 0.5 : 0.0;
    float off3 = gUV.x > gUV.y ? 0.0 : 1.0;

    // if(gUV.x > gUV.y)
    // if(gUV.x < gUV.y)
    {
        vec2 uvProj = vec2(
            auv.x, 
            round(auv.y/hexDim.y - off)*hexDim.y
            );
        



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

        // vec2 right = vec2(
        //     ceil(auv.x/(hexDim.x*2.0))*(hexDim.x*2.0), 
        //     ceil(auv.y/hexDim.y)*hexDim.y
        //     );

        // vec2 right = vec2(
        //     round(auv.x/(hexDim.x*2.0))*(hexDim.x*2.0) - hexDim.x, 
        //     floor(auv.y/hexDim.y)*hexDim.y
        //     );

        if(gUV.x < gUV.y)
        {
            // swap(tip, left);

            // fragColor.a = 0.75;
        }
        else
        {
            // if(mod(floor(auv.y/(hexSize)), 2.0) > 0.f)
            // {
            //     fragColor.a = 0.75;
            // }
        }


        // seed = tip;

        fragColor.g = distance(uvProj, auv)/hexDim.y;
        fragColor.g = 1.0 - distance(tip, auv)/hexDim.y;
        fragColor.r = 1.0 - distance(left, auv)/hexDim.y;
        fragColor.b = 1.0 - distance(right, auv)/hexDim.y;
        
    }


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