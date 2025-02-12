#include ../../data/noises/utils.glsl

void main()
{
    UV_PREPROCESS

    // auv *= 0.5;


    float slice = 0.001 * pow(xrange.y, 4.0);
    float a = uv.x*(1.+slice) - slice*.5;
    a = clamp(a, 0., 1.);
    a = smoothstep(0., 1., a);
    // a = pow(a, .5);

    // a = mix(0.2, 0.8, a);

    vec3 nVorCenter;
    // vec3 nVor = voronoi3d(vec3(10.0*auv, 0), nVorCenter).rgb;

    fragColor.rgb = a.rrr;

    vec3 grey[4];
    vec3 esp[4];

    // Classic perlin noise "camo" mode
    grey[0] = 1.0 - (smoothstep(0.9, 1.0, 1.0 - cnoise(40.0 * auv * vec2(0.25, 1.0)))).rrr;
    esp[0] = 0.76.rrr;

    // Classic perlin noise "gradient" mode
    grey[1] = (smoothstep(-0.25, 1.0, 0.75 - cnoise(auv*30.0 * -vec2(0.75, 1.0)))).rrr;
    esp[1] = 0.79.rrr;

    // Gradient noise
    grey[2] = gradientNoise(auv*10.0).rrr;
    esp[2] = 0.5.rrr;

    // Voronoi
    grey[3] = voronoi3d(vec3(auv*20.0, 0), nVorCenter).rrr;
    esp[3] = 0.529.rrr;

    int b = 2;
    int c = 3;

    // grey[b] = vec3(1);
    // grey[c] = vec3(1);
    // esp[b] = vec3(1);
    // esp[c] = vec3(1);

    vec3 color1 = vec3(1., 0.0, 1);
    vec3 color2 = vec3(0.9, 0.9, 0.3);

    // grey[b] *= color1;
    // esp[b] *= color1;

    // grey[c] *= color2;
    // esp[c] *= color2;


    grey[b] = hsv2rgb(vec3(grey[b].x*0.5 + 0.9, 2., 1.));
    esp[b] = vec3(0.87, 0.69, 0.0);

    grey[c] = hsv2rgb(vec3(grey[c].x*0.3 - 0.7, grey[c].y + 0.1, 1.));
    esp[c] = vec3(0.37, 0.97, 0.86);

    // a = 1;


    // Simple blending
    fragColor.rgb = mix(grey[c], grey[b], a.rrr);

    // Variance preserving blending
    float ai = 1.-a;
    vec3 espf = esp[b]*a + esp[c]*ai;
    fragColor.rgb = espf + (grey[b]*a + grey[c]*ai - espf)/sqrt((a*a + ai*ai));

    // fragColor.rgb = smoothstep(vec3(0.), vec3(1.), fragColor.rgb);

    // if(a > 1.0)
    //     fragColor.rgb = vec3(1, 0, 0);
    // else if(a < 0.)
    //     fragColor.rgb = vec3(0, 1, 0);
}