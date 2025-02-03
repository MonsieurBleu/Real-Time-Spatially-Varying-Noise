#version 460

#include uniform/Base3D.glsl
#include uniform/Model3D.glsl

#include functions/Noise.glsl
#include functions/HSV.glsl
#include ../../data/noises/utils.glsl

layout (location = 0) out vec4 fragColor;

// layout (binding = 0) uniform sampler2D bTexture;

layout (location = 32) uniform vec2 xrange;
layout (location = 33) uniform vec2 yrange;

in vec2 uv;
in vec2 scale;

in float tmp;

vec3 gravitationalNoise(vec2 auv)
{
    float d = 0;
    float d2 = 0;

    float s = 0.2;

    int first_iteration = 0;

    for(int i = 0; i < 10; i++)
    {
        vec3 r = rand3to3(s.xxx);

        vec2 off = s * (r.xy - 0.5);
        // off = vec2(0);

        float sa = sin(r.x*PI);
        float ca = cos(r.x*PI);
        vec2 auvMod = vec2(
            auv.xx * vec2(ca, sa) + auv.yy * vec2(-sa, ca)
        );

        // auvMod = auv + off;
        auv = auvMod;

        vec2 grid = auv - mod(auvMod, s);

        // auv += off;
        // vec2 grid = auv - mod(auv, s);


        vec2 center = grid + s*0.5 + s*0.5*(r.xy - 0.5);

        vec3 hash = rand3to3(vec3(grid, 0));

        if(i >= first_iteration)
        {
            if(length(hash.xyz) < 1.0)
            {
                d = 1.0;
                d = 1.0 - 4.0*distance(auv, center)/s;

                d = clamp(d, 0.0, 1.0);

                auv = mix(auv, center, pow(d, 1.0 + 2.0*hash.z));

                d2 += pow(d, 0.5 + 2.0*hash.z);
            }
        }

        s += r.z * s * 5.0;
    }

    return vec3(auv, d2);
}




float distanceFunction(vec2 auv)
{
    // return gravitationalNoise(auv).z;

    // return distance(auv, cos(auv) + auv);

    vec3 gradient = gradientNoise(auv*5.0).xxx;
    vec3 center;
    vec3 voronoi = voronoi3d(vec3(auv*10, 0), center).rrr;

    // auv /= 2.0-sign(auv);

    // auv += 1e6;

    // auv *= 2.0;

    // auv = gradient.xx * 50.0;

    // auv = distance(auv, mod(auv, 5.0) + 2.5).xx;


    // auv = mix(auv, vec2(0), length(auv));




    // float gridSize = 10.0;
    // vec2 gridCenter = auv - mod(auv, gridSize) + gridSize*0.5;

    // return 1.0 - 2.0*distance(auv, gridCenter)/gridSize;

    auv = cos(auv * 0.1);

    return distance(auv, vec2(0));
}

void main()
{
    vec2 auv = uv *2.0 - 1.0;    

    CorrectUV(auv, scale);
    
    float viewUVoffMax = 8.0;
    // auv += mod(_iTime*0.05, viewUVoffMax) - viewUVoffMax*0.5;
    auv.x *= xrange.y * 0.5;
    auv.y *= yrange.y * 0.5;


    float c = 0;
    

    // fragColor.rg = mod(atan(auv), vec2(0.1))*10;
    
    // vec2 velocity = auv;
    // vec2 dirToCenterAttration = normalize(auv);
    // auv = auv + velocity - dirToCenterAttration;

    auv *= 5.0;

    float d = distanceFunction(auv);

    float gridSize = 100.0;
    vec2 gridCenter = auv - mod(auv, gridSize) + gridSize*0.5;
    gridCenter = vec2(0);
    // d = (gridSize*0.5 - distance(auv, gridCenter))/gridSize;
    // vec3 r = rand3to3(vec3(gridCenter, 0));

    float sa = sin(d);
    float ca = cos(d);

    auv -= gridCenter;
    vec2 auvMod = vec2(
        auv.xx * vec2(ca, sa) + auv.yy * vec2(-sa, ca)
    );
    auvMod += gridCenter;
    auv = auvMod;

    c = cos(auv.x)*0.5 + 0.5;


    vec3 gradient = gradientNoise(auv*5.0).xxx;
    vec3 center;
    vec3 voronoi = voronoi3d(vec3(auv*10, 0), center);

    float grid = max(
        pow(cos(auv.y*5*PI / yrange.y)*0.5 + 0.5, 20),
        pow(cos(auv.x*5*PI / yrange.y)*0.5 + 0.5, 20)
        );
        
    // fragColor.rgb = c.rrr;
    fragColor.r = cos(auv.x)*0.5 + 0.5;
    fragColor.b = cos(auv.y)*0.5 + 0.5;
    
    // fragColor.rgb = voronoi.rgb;

    // fragColor.rbg *= 1.0 - grid;
    // fragColor.g += grid*0.5;

    // fragColor.rgb = d.rrr;

    fragColor.a = 1.0;

    // fragColor.rgb = hsv2rgb(vec3(_iTime*0.1, uv.x, uv.y));
    // fragColor.rgb = vec3(pow(cos(uv.x*PI*6), 2));
    fragColor.rgb = rand3to3(vec3(uv*1000.0, 0));

    // fragColor.rgb = vec3(1, 0.5, 0);
}