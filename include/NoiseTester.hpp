#pragma once
#include <NoiseEntity.hpp>
#include <Blueprint/EngineBlueprintUI.hpp>

namespace NoiseTester
{
    inline EntityRef root;

    // inline float textMargin = 0.05;
    inline float textMargin = 0.0001;

    void createNoisesMaterials();

    struct NoiseTesterGroup
    {
        EntityRef visual;
        EntityRef controls;
    };

    NoiseTesterGroup noiseSprite(const std::string &materialName, vec2 xrange, vec2 yrange);

    inline int entry1 = 0;
    inline int entry2 = 1;

    inline int priority1 = 0;
    inline int priority2 = 1;

    inline float baseVariance = 0.;

    inline float alpha = 0.;

    inline int gridAlphaMode = -1;
    inline int gridVarianceMode = -1;

    inline int method = 2;
    inline int output = 0;
    inline int varianceMethod = 2;
    inline int priorityMethod = 1;
    inline int view = 0;

    inline ivec2 invertPriotiy = ivec2(0);
    inline ivec2 invertEntry = ivec2(0);

    inline vec3 color1 = vec3(VulpineColorUI::HightlightColor3);
    inline vec3 color2 = vec3(VulpineColorUI::HightlightColor2);

    inline std::unordered_map<std::string, int> entries = 
    {
        {"Voronoi 1", 0},
        {"Voronoi 2", 1},
        {"Local Random Phase 1", 2},
        {"Local Random Phase 2", 3},
        // {"Rock", 4},
        // {"Paving Stones", 5},
        // {"Grass", 6}
        {"os", 4},
        {"muscle", 5},
        {"graisse", 6}
    };
}