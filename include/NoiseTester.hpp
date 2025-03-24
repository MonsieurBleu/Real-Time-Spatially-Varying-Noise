#pragma once
#include <NoiseEntity.hpp>

namespace NoiseTester
{
    inline EntityRef root;

    inline float textMargin = 0.05;

    void createNoisesMaterials();

    EntityRef noiseSprite(const std::string &materialName, vec2 xrange, vec2 yrange);
}