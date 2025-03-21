#version 460

#define USING_VERTEX_TEXTURE_UV

#include uniform/Base3D.glsl
#include uniform/Model3D.glsl

layout(location = 0) in vec3 _position;

layout (location = 32) uniform vec2 xrange;
layout (location = 33) uniform vec2 yrange;

out vec2 uv;

out vec2 scale;

void main()
{
    vec2 p = _position.xy*vec2(1, -1);
    uv = p;

    vec3 position = (_modelMatrix * vec4(_position, 1.0)).rgb;


    scale = vec2(
        length(vec3(_modelMatrix[0].x, _modelMatrix[1].x, _modelMatrix[2].x)),
        length(vec3(_modelMatrix[0].y, _modelMatrix[1].y, _modelMatrix[2].y))
    );

    position.z = _modelMatrix[3].z + 0.01;

    gl_Position = vec4(position, 1.0);
};