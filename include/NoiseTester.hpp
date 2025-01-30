#pragma once
#include <NoiseEntity.hpp>

namespace NoiseTester
{
    inline EntityRef root;

    void createNoisesMaterials();

    EntityRef noiseSprite(const std::string &materialName, vec2 xrange, vec2 yrange);
}