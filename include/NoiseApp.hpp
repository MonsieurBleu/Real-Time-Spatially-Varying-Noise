#pragma once
#include <App.hpp>
#include <Graphics/Fonts.hpp>
#include <Graphics/FastUI.hpp>
#include <NoiseEntity.hpp>

#include <list>

class NoiseApp final : public App
{
private:

    /* UI */
    FontRef FUIfont;    
    MeshMaterial defaultFontMaterial;
    MeshMaterial defaultSUIMaterial;
    SimpleUiTileBatchRef fuiBatch;

    std::list<EventInput*> _inputs;

    EntityRef rootEntity;
    EntityRef controlsEntity;

    void addNoiseViewers();
    void removeNoiseViewers();
    std::string currentNoise = "test - 2D";

    bool doScreenshot = false;
    bool doResize = false;

public:
    
    static inline bool doAutomaticShaderRefresh = false;

    NoiseApp(GLFWwindow *window);
    void init(int paramSample);
    // bool userInput(GLFWKeyInfo input);
    void mainloop();
    void initInput();
};
