#include <NoiseApp.hpp>
#include <Globals.hpp>
#include <Inputs.hpp>
#include <Globals.hpp>
#include <AssetManager.hpp>
#include <Blueprint/EngineBlueprintUI.hpp>
#include <NoiseTester.hpp>

NoiseApp::NoiseApp(GLFWwindow *window) : App(window){}

void NoiseApp::init(int paramSample)
{
    globals._renderScale = 1;
    globals._UI_res_scale = 2;

    App::init();
    loadAllAssetsInfos("data/");
    NoiseTester::createNoisesMaterials();
    App::setController(nullptr);
    ambientLight = vec3(0.1);
    camera.init(radians(90.0f), globals.windowWidth(), globals.windowHeight(), 0.1f, 1E4f);

    /* Loading final processing stage */
    finalProcessingStage = ShaderProgram(
        "shader/post-process/final composing.frag",
        "shader/post-process/basic.vert",
        "",
        globals.standartShaderUniform2D());

    finalProcessingStage
        .addUniform(ShaderUniform(camera.getProjectionViewMatrixAddr(), 2))
        .addUniform(ShaderUniform(camera.getViewMatrixAddr(), 3))
        .addUniform(ShaderUniform(camera.getProjectionMatrixAddr(), 4))

        .addUniform(ShaderUniform(Bloom.getIsEnableAddr(), 10))
        // .addUniform(ShaderUniform(&editorModeEnable, 11))
        .addUniform(ShaderUniform(&globals.sceneChromaticAbbColor1, 32))
        .addUniform(ShaderUniform(&globals.sceneChromaticAbbColor2, 33))
        .addUniform(ShaderUniform(&globals.sceneChromaticAbbAngleAmplitude, 34))
        .addUniform(ShaderUniform(&globals.sceneVignette, 35))
        .addUniform(ShaderUniform(&globals.sceneHsvShift, 36));

    // setIcon("ressources/icon.png");

    /* UI */
    FUIfont = FontRef(new FontUFT8);
    FUIfont->readCSV("fonts/Roboto/out.csv");
    FUIfont->setAtlas(Texture2D().loadFromFileKTX("fonts/Roboto/out.ktx"));

    globals.baseFont = FUIfont;

    defaultFontMaterial = MeshMaterial(
        new ShaderProgram(
            "shader/2D/text.frag",
            "shader/2D/text.vert",
            "",
            globals.standartShaderUniform2D()));


    defaultSUIMaterial = MeshMaterial(
        new ShaderProgram(
            "shader/2D/fastui.frag",
            "shader/2D/fastui.vert",
            "",
            globals.standartShaderUniform2D()));

    fuiBatch = SimpleUiTileBatchRef(new SimpleUiTileBatch);
    fuiBatch->setMaterial(defaultSUIMaterial);
    fuiBatch->state.position.z = 0.0;
    fuiBatch->state.forceUpdate();

    /* VSYNC and fps limit */
    globals.fpsLimiter.activate();
    globals.fpsLimiter.freq = 144.f;
    // globals.fpsLimiter.freq = 45.f;
    glfwSwapInterval(0);

    /* Loading assets */
    loadAllAssetsInfos("data");
    loadAllAssetsInfos("shader/vulpineMaterials");

    initInput();
}

void NoiseApp::initInput()
{    
    _inputs.push_back(&
        InputManager::addEventInput(
            "quit game", GLFW_KEY_ESCAPE, 0, GLFW_PRESS, [&]() { state = AppState::quit; },
            InputManager::Filters::always, false)
    );

    _inputs.push_back(&
        InputManager::addEventInput(
            "toggle auto shader refresh", GLFW_KEY_F6, 0, GLFW_PRESS, [&]() {
                doAutomaticShaderRefresh = !doAutomaticShaderRefresh;
            },
            InputManager::Filters::always, false)
    );
}

void NoiseApp::addNoiseViewers()
{
    ComponentModularity::addChild(
        *rootEntity, 
        NoiseTester::noiseSprite(
            currentNoise, 
            vec2(-1, 1), 
            vec2(-1, 1)
        )
    );

    ComponentModularity::addChild(
        *rootEntity, 
        NoiseTester::noiseSprite(
            currentNoise, 
            vec2(-10, 10), 
            vec2(-10, 10)
        )
    );

    ComponentModularity::addChild(
        *rootEntity, 
        NoiseTester::noiseSprite(
            currentNoise, 
            vec2(-40, 40), 
            vec2(-40, 40)
        )
    );
}

void NoiseApp::removeNoiseViewers()
{
    rootEntity->comp<EntityGroupInfo>().children.pop_back();
    rootEntity->comp<EntityGroupInfo>().children.pop_back();
    rootEntity->comp<EntityGroupInfo>().children.pop_back();

    ManageGarbage<WidgetBackground>();
    ManageGarbage<WidgetSprite>();
    ManageGarbage<WidgetText>();
}

void NoiseApp::mainloop()
{
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    glEnable(GL_DEPTH_TEST);
    glLineWidth(1.0);

    /****** Setting Up Debug UI *******/
    FastUI_context ui(fuiBatch, FUIfont, scene2D, defaultFontMaterial);
    ui.spriteMaterial = Loader<MeshMaterial>::get("sprite");
    ui.colorTitleBackground.a = 0.9f;

    VulpineBlueprintUI::UIcontext = WidgetUI_Context{&ui};

    rootEntity = newEntity("root"
        , UI_BASE_COMP
        , WidgetBox()
        , WidgetBackground()
        , WidgetStyle()
            .setbackgroundColor1(VulpineColorUI::DarkBackgroundColor1Opaque)
            .setbackGroundStyle(UiTileType::SQUARE)
        , EntityGroupInfo()
    );

    // EntityRef test = VulpineBlueprintUI::ColoredConstEntry("TEST", [](){return U"SALUT JE SUIS LE TEST";});
    // ComponentModularity::addChild(*rootEntity, test);

    rootEntity->comp<WidgetStyle>().setautomaticTabbing(1);

    std::unordered_map<std::string, EntityRef> noiseMap;

    for(auto &i : Loader<MeshMaterial>::loadingInfos)
        Loader<MeshMaterial>::get(i.first);

    for(auto &i : Loader<MeshMaterial>::loadedAssets)
    {
        if(i.second->vert.get_Path() == "data/noises/noise2D.vert")
        {
            noiseMap[i.first] = EntityRef();
        }
    }

    ComponentModularity::addChild(
        *rootEntity, 
        VulpineBlueprintUI::StringListSelectionMenu(
            "Noise Selection Menu", noiseMap, 
            [&](Entity *e, float v)
            {
                removeNoiseViewers();
                currentNoise = e->comp<EntityInfos>().name;
                addNoiseViewers();
                NOTIF_MESSAGE(currentNoise);
            },
            [&](Entity *e)
            {
                return e->comp<EntityInfos>().name == currentNoise ? 0.f : 1.f;
            },
            0.f
        )
    );

    addNoiseViewers();

    // ComponentModularity::addChild(
    //     *rootEntity, 
    //     NoiseTester::noiseSprite(
    //         "test2D", 
    //         vec2(-1, 1), 
    //         vec2(-10, 10)
    //     )
    // );

    doAutomaticShaderRefresh = true;

    while (state != AppState::quit)
    {
        mainloopStartRoutine();

        for (GLFWKeyInfo input; inputs.pull(input); userInput(input), InputManager::processEventInput(input))
            ;

        InputManager::processContinuousInputs();

        if (glfwWindowShouldClose(globals.getWindow()))
            state = AppState::quit;

        static unsigned int itcnt = 0;
        itcnt++;
        if (doAutomaticShaderRefresh)
        {
            if (itcnt % 50 == 0)
            {
                system("clear");
                std::cout << TERMINAL_INFO << "Refreshing ALL shaders...\n" << TERMINAL_RESET;

                ui.fontMaterial->reset();
                defaultSUIMaterial->reset();
                finalProcessingStage.reset();

                for (auto &m : Loader<MeshMaterial>::loadedAssets)
                    m.second->reset();
            }
        }

        /* Retreiving the 2D scene RGB values */
        auto &screenTexture = screenBuffer2D.getTexture(0);
        screen2Dres = screenTexture.getResolution();
        // NOTIF_MESSAGE(vec2(screen2Dres));
        screen2D.resize(screen2Dres.x * screen2Dres.y);
        screenTexture.bind(0);
        glGetTexImage(GL_TEXTURE_2D, 0, GL_RGB, GL_UNSIGNED_BYTE, screen2D.data());

        /* UI Update */
        WidgetUI_Context uiContext = WidgetUI_Context(&ui);
        updateEntityCursor(globals.mousePosition(), globals.mouseLeftClickDown(), globals.mouseLeftClick(), VulpineBlueprintUI::UIcontext);
        ComponentModularity::synchronizeChildren(rootEntity);
        updateWidgetsStyle();

        mainloopPreRenderRoutine();

        /* UI & 2D Render */
        glEnable(GL_BLEND);
        glEnable(GL_FRAMEBUFFER_SRGB);

        glDepthFunc(GL_GEQUAL);
        glEnable(GL_DEPTH_TEST);
        // glDisable(GL_DEPTH_TEST);

        scene2D.updateAllObjects();
        fuiBatch->batch();
        screenBuffer2D.activate();
        scene2D.cull();
        scene2D.draw();
        screenBuffer2D.deactivate();

        /* 3D Pre-Render */
        glDisable(GL_FRAMEBUFFER_SRGB);
        glDisable(GL_BLEND);
        glDepthFunc(GL_GREATER);
        glEnable(GL_DEPTH_TEST);

        scene.updateAllObjects();

        scene.generateShadowMaps();
        globals.currentCamera = &camera;
        renderBuffer.activate();
        scene.cull();

        /* 3D Render */
        scene.genLightBuffer();
        scene.draw();
        renderBuffer.deactivate();

        glPolygonMode(GL_FRONT_AND_BACK, GL_FILL);

        /* Post Processing */
        renderBuffer.bindTextures();
        // SSAO.render(*globals.currentCamera);
        // Bloom.render(*globals.currentCamera);

        /* Final Screen Composition */
        glViewport(0, 0, globals.windowWidth(), globals.windowHeight());
        finalProcessingStage.activate();
        screenBuffer2D.bindTexture(0, 7);
        globals.drawFullscreenQuad();

        /* Main loop End */
        mainloopEndRoutine();
    }
}