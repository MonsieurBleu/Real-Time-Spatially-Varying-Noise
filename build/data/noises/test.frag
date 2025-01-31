#version 460

#include uniform/Base3D.glsl
#include uniform/Model3D.glsl

#include functions/Noise.glsl
#include ../../data/noises/utils.glsl

layout (location = 0) out vec4 fragColor;

// layout (binding = 0) uniform sampler2D bTexture;

layout (location = 32) uniform vec2 xrange;
layout (location = 33) uniform vec2 yrange;

in vec2 uv;
in vec2 scale;

in float tmp;




void main()
{
    vec2 auv = uv *2.0 - 1.0;    
    float viewUVoffMax = 8.0;
    auv += mod(_iTime*0.05, viewUVoffMax) - viewUVoffMax*0.5;

    auv.x *= xrange.y * 0.5;
    auv.y *= yrange.y * 0.5;
    
    CorrectUV(auv, scale),

    // float bias = 1e-3;
    // if(
    //     auv.x < bias || auv.y < bias || auv.x > 1-bias || auv.y > 1-bias
    // )
    //     discard;

    // auv.x *= xrange.y;
    // auv.y *= yrange.y;



    fragColor.a = 1.0;
    fragColor.b = pow(tmp, 10);

    // fragColor.rgb = vec3(gradientNoise(auv*10));

    // auv -= mod(auv, 0.1);
    // fragColor.rgb = rand3to3(vec3(auv*10, 0));

    vec2 auvTMP = auv;

    float d = 0;
    float d2 = 0;

    float s = 0.2;


    // if(hash.x < 0.1)

    int first_iteration = 0;

    for(int i = 0; i < 12; i++)
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

                auv = mix(auv, center, -pow(d, 1.0 + 2.0*hash.z));

                d2 += pow(d, 0.5 + 2.0*hash.z);
            }
        }

        s += r.z * s * 5.0;
    }

    // fragColor.rgb = vec3(d);

    vec3 gradient = gradientNoise(auvTMP*5.0).xxx;
    vec3 center;
    vec3 voronoi = voronoi3d(vec3(auv*10, 0), center).rrr;

    float grid = max(
        pow(cos(auv.y*50*PI / yrange.y)*0.5 + 0.5, 20),
        pow(cos(auv.x*50*PI / yrange.y)*0.5 + 0.5, 20)
        );
    fragColor.rbg *= 1.0 - grid;
    fragColor.g += grid;


    fragColor.rgb =  voronoi;



    fragColor.rgb = mix(voronoi, gradient, clamp(pow(d2, 1.0), 0, 1));

    // fragColor.rgb = (d2/2).rrr;



    // auv -= mod(auv, 0.01 * xrange.y );
    // fragColor.rgb = rand3to3(vec3(auv*10, 0));
    // fragColor.rgb = vec3(length(fragColor.rgb)/length(vec3(1)));
}