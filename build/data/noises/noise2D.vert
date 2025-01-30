#version 460

#define USING_VERTEX_TEXTURE_UV

#include uniform/Base3D.glsl
#include uniform/Model3D.glsl

layout(location = 0) in vec3 _position;

layout (location = 32) uniform vec2 xrange;
layout (location = 33) uniform vec2 yrange;

out vec2 uv;

out vec2 scale;

out float tmp;

void main()
{
    vec2 p = _position.xy*vec2(1, -1);
    uv = p;

    // uv.x *= xrange.y;
    // uv.y *= yrange.y;

    float bias = 0.001;

    // if(distance(p.x, 1) < bias && distance(p.y, 0) < bias)
    //     uv = vec2(2,2);

    // if(distance(p.x, 0) < bias && distance(p.y, 0) < bias)
    //     uv = vec2(2, 2);

    tmp = 0.0;
    if(distance(p.y, -1.0) < bias)
    {
        // uv.x *= 1.5;
        // uv.y = 0;
        // uv.x *= 1.5 * p.y;

        // if(distance(p.x, 1.0) < bias)
        // {
        //     tmp = 1.0;
        //     uv.x *= 1.5;
        // }

        // if(distance(p.x, -1.0) < bias)
        // {
        //     tmp = 1.0;
        //     uv.x *= 1.5;
        // }

    }

    // uv *= xrange.y;

    // if(distance(p.x, 1) < bias)
    //     uv.x = 0;

    vec3 position = (_modelMatrix * vec4(_position, 1.0)).rgb;


    scale = vec2(
        length(vec3(_modelMatrix[0].x, _modelMatrix[1].x, _modelMatrix[2].x)),
        length(vec3(_modelMatrix[0].y, _modelMatrix[1].y, _modelMatrix[2].y))
    );

    position.z = _modelMatrix[3].z + 0.01;

    gl_Position = vec4(position, 1.0);
};