#version 460

#include uniform/Base3D.glsl
#include uniform/Model3D.glsl

#include functions/Noise.glsl

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


    // auv.x = mix(
    //     mix(xrange.x, xrange.y, uv.x),
    //     mix(yrange.x, yrange.y, uv.x),
    //     uv.y
    // );

    // auv.y = mix(
    //     mix(xrange.x, xrange.y, uv.y),
    //     mix(yrange.x, yrange.y, uv.y),
    //     uv.x
    // );

    // auv.x += cos(_iTime)*0.25;
    // auv.y += sin(_iTime)*0.25;
    
    auv += mod(_iTime*0.05, 512);
    auv.x *= xrange.y;
    auv.y *= yrange.y;

    // auv.y = mix(yrange.y, yrange.x, uv.x);

    
    vec2 ascale = scale;
    ascale.y /= float(_iResolution.x)/float(_iResolution.y);

    if(ascale.x > ascale.y)
    {
        auv.x *= ascale.x/ascale.y;
        auv.x -= 0.5 * (scale.x/scale.y) * (float(_iResolution.x)/float(_iResolution.y));
        auv.x += 0.5;
        auv *= float(_iResolution.y)/1000;
    }
    else
    {
        auv.y /= ascale.x/ascale.y;
        auv.y += 0.5;
        auv.y -= 0.5 * (scale.y/scale.x) * (float(_iResolution.y)/float(_iResolution.x));
        auv *= float(_iResolution.x)/1000;
    }

    // float bias = 1e-3;
    // if(
    //     auv.x < bias || auv.y < bias || auv.x > 1-bias || auv.y > 1-bias
    // )
    //     discard;

    // auv.x *= xrange.y;
    // auv.y *= yrange.y;



    fragColor.a = 1.0;

    fragColor.r = pow(cos(auv.x*20)*0.5 + 0.5, 1);
    fragColor.g = pow(cos(auv.y*20)*0.5 + 0.5, 1);
    fragColor.b = pow(tmp, 10);

    vec3 center;
    fragColor.rgb = voronoi3d(vec3(auv*10, 0), center);

    fragColor.rgb = vec3(gradientNoise(auv*10));

    auv -= mod(auv, 0.1);
    fragColor.rgb = rand3to3(vec3(auv*10, 0));

    // fragColor.b = min(distance(uv, vec2(0, 0)), distance(uv, vec2(1, 0)));
    // fragColor.b = distance(auv.y, 0);
    
    if(fragColor.a == 0.f) discard;
}