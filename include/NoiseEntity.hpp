#pragma once

#define MAX_COMP    64
#define MAX_ENTITY  (1<<13)

#include <ECS/ModularEntityGroupping.hpp>
#include <ECS/EngineComponents.hpp>


#undef CURRENT_MAX_COMP_USAGE
#define CURRENT_MAX_COMP_USAGE MAX_ENTITY

