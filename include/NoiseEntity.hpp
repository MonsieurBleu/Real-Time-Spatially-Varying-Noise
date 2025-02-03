#pragma once

#define MAX_COMP    64
#define MAX_ENTITY  (1<<13)

#include <ECS/ModularEntityGroupping.hpp>
#include <ECS/EngineComponents.hpp>


#undef CURRENT_MAX_COMP_USAGE
#define CURRENT_MAX_COMP_USAGE MAX_ENTITY

#define u8vec3 glm::vec<3, uint8, glm::defaultp>

inline std::vector<u8vec3> screen2D;
inline ivec2 screen2Dres;

struct WidgetRenderInfos
{
    vec3 hist[256];
    vec3 avg;
};

Adaptive_Component(WidgetRenderInfos)


