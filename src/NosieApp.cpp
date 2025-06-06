#include <NoiseApp.hpp>
#include <Globals.hpp>
#include <Inputs.hpp>
#include <Globals.hpp>
#include <AssetManager.hpp>
#include <Blueprint/EngineBlueprintUI.hpp>
#include <NoiseTester.hpp>
#include <MathsUtils.hpp>

#include <stb/stb_image_write.h>
#include <stb/stb_image_resize.h>
#include <stb/stb_image.h>

NoiseApp::NoiseApp(GLFWwindow *window) : App(window){}


void NoiseApp::init(int paramSample)
{
    globals._renderScale = 1;
    globals._UI_res_scale = 1.;


    VulpineColorUI::DarkBackgroundColor1 = vec4(1.0);
    // VulpineColorUI::DarkBackgroundColor2 = vec4(0.75);

    VulpineColorUI::LightBackgroundColor1 = vec4(0, 0, 0, 1);
    VulpineColorUI::LightBackgroundColor2 = vec4(0, 0, 0, 0.5);

    
    VulpineColorUI::DarkBackgroundColor1Opaque = vec4(vec3(VulpineColorUI::DarkBackgroundColor1), 1.);
    VulpineColorUI::DarkBackgroundColor2Opaque = vec4(vec3(VulpineColorUI::DarkBackgroundColor2), 1.);

    VulpineColorUI::HightlightColor1 *= vec4(vec3(.5), 1.);
    VulpineColorUI::HightlightColor2 *= vec4(vec3(.5), 1.);
    VulpineColorUI::HightlightColor3 *= vec4(vec3(.5), 1.);
    VulpineColorUI::HightlightColor4 *= vec4(vec3(.5), 1.);
    VulpineColorUI::HightlightColor5 *= vec4(vec3(.5), 1.);
    VulpineColorUI::HightlightColor6 *= vec4(vec3(.5), 1.);


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
    glfwSwapInterval(1);

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

    _inputs.push_back(&
        InputManager::addEventInput(
            "toggle auto shader refresh", GLFW_KEY_F2, 0, GLFW_PRESS, [&]() {
                doResize = true;
            },
            InputManager::Filters::always, false)
    );

    _inputs.push_back(&
        InputManager::addEventInput(
            "toggle auto shader refresh", GLFW_KEY_F1, 0, GLFW_PRESS, [&]() {
                
                System<WidgetRenderInfos>([](Entity &entity)
                {
                    WidgetRenderInfos& rinfo = entity.comp<WidgetRenderInfos>();
                    for(int i = 0; i < 3; i++)
                    {
                        // std::cout << "\n= float[](0., ";
                        std::cout << "\n= float[](";
                        float cnt = 0.;
                        for(int j = 0; j < 256; j++)
                        {
                            cnt += rinfo.hist[j][i];

                            if(j && j%8 == 0)
                                std::cout << cnt << ", ";
                        }
                        std::cout << cnt << ");\n";
                    }
                });

            },
            InputManager::Filters::always, false)
    );

    _inputs.push_back(&
        InputManager::addEventInput(
            "toggle auto shader refresh", GLFW_KEY_F4, 0, GLFW_PRESS, [&]() {
                
                System<WidgetRenderInfos>([](Entity &entity)
                {
                    WidgetRenderInfos& rinfo = entity.comp<WidgetRenderInfos>();
                    for(int i = 0; i < 3; i++)
                    {
                        // std::cout << "\n= float[](0., ";
                        float cnt = 0.;
                        for(int j = 0; j < 256; j++)
                        {
                            if(j%32 == 0)
                                std::cout << "(" << (float)j/256. << "," << rinfo.hist[j][i] << ")\n";
                        }
                    }
                });

            },
            InputManager::Filters::always, false)
    );


    _inputs.push_back(&
        InputManager::addEventInput(
            "toggle auto shader refresh", GLFW_KEY_F3, 0, GLFW_PRESS, [&]() {

                doMipMapGeneration = true;
                
            },
            InputManager::Filters::always, false)
    );

}

void NoiseApp::addNoiseViewers()
{
    auto n = NoiseTester::noiseSprite(
        currentNoise, 
        vec2(-1, 1), 
        vec2(-1, 1)
    );

    ComponentModularity::addChild(
        *rootEntity, n.visual
    );

    ComponentModularity::addChild(
        *controlsEntity, n.controls
    );

    // ComponentModularity::addChild(
    //     *rootEntity, 
    //     NoiseTester::noiseSprite(
    //         currentNoise, 
    //         vec2(-10, 10), 
    //         vec2(-10, 10)
    //     )
    // );

    // ComponentModularity::addChild(
    //     *rootEntity, 
    //     NoiseTester::noiseSprite(
    //         currentNoise, 
    //         vec2(-40, 40), 
    //         vec2(-40, 40)
    //     )
    // );
}

void NoiseApp::removeNoiseViewers()
{
    rootEntity->comp<EntityGroupInfo>().children.pop_back();
    controlsEntity->comp<EntityGroupInfo>().children.pop_back();
    // rootEntity->comp<EntityGroupInfo>().children.pop_back();
    // rootEntity->comp<EntityGroupInfo>().children.pop_back();

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

    std::unordered_map<std::string, EntityRef> entriesButtons1;
    std::unordered_map<std::string, EntityRef> entriesButtons2;

    std::unordered_map<std::string, EntityRef> priorityButtons1;
    std::unordered_map<std::string, EntityRef> priorityButtons2;

    
    for(auto i : NoiseTester::entries)
    {
        entriesButtons1[i.first] = EntityRef();
        entriesButtons2[i.first] = EntityRef();
        priorityButtons1[i.first] = EntityRef();
        priorityButtons2[i.first] = EntityRef();
    }

    ComponentModularity::addChild(
        *rootEntity,
        newEntity("Menu"
            , UI_BASE_COMP
            , WidgetBox()
            , WidgetStyle()
                .setautomaticTabbing(2)
                .setuseInternalSpacing(false)
            , EntityGroupInfo({

                newEntity("Selection Parent Menu"
                    , UI_BASE_COMP
                    , WidgetBox()
                    , WidgetStyle()
                        .setautomaticTabbing(1)
                    , EntityGroupInfo({

                        VulpineBlueprintUI::StringListSelectionMenu(
                            "Material", noiseMap, 
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
                            -0.5f,
                            VulpineColorUI::HightlightColor1,
                            0.075f
                        ),
                        VulpineBlueprintUI::StringListSelectionMenu(
                            "Texture 1", entriesButtons1, 
                            [&](Entity *e, float v)
                            {
                                NoiseTester::entry1 = NoiseTester::entries[e->comp<EntityInfos>().name];
                                NoiseTester::priority1 = NoiseTester::entries[e->comp<EntityInfos>().name];
                            },
                            [&](Entity *e)
                            {
                                return NoiseTester::entry1 == NoiseTester::entries[e->comp<EntityInfos>().name] ? 0. : 1.;
                            },
                            -0.5f,
                            VulpineColorUI::HightlightColor3,
                            0.075f
                        ),
                        VulpineBlueprintUI::StringListSelectionMenu(
                            "Priority 1", priorityButtons1, 
                            [&](Entity *e, float v)
                            {
                                NoiseTester::priority1 = NoiseTester::entries[e->comp<EntityInfos>().name];
                            },
                            [&](Entity *e)
                            {
                                return NoiseTester::priority1 == NoiseTester::entries[e->comp<EntityInfos>().name] ? 0. : 1.;
                            },
                            -0.5f,
                            VulpineColorUI::HightlightColor3,
                            0.075f
                        ),
                        VulpineBlueprintUI::StringListSelectionMenu(
                            "Texture 2", entriesButtons2, 
                            [&](Entity *e, float v)
                            {
                                NoiseTester::entry2 = NoiseTester::entries[e->comp<EntityInfos>().name];
                                NoiseTester::priority2 = NoiseTester::entries[e->comp<EntityInfos>().name];
                            },
                            [&](Entity *e)
                            {
                                return NoiseTester::entry2 == NoiseTester::entries[e->comp<EntityInfos>().name] ? 0. : 1.;
                            },
                            -0.5f,
                            VulpineColorUI::HightlightColor2,
                            0.075f
                        ),
                        VulpineBlueprintUI::StringListSelectionMenu(
                            "Priority 2", priorityButtons2, 
                            [&](Entity *e, float v)
                            {
                                NoiseTester::priority2 = NoiseTester::entries[e->comp<EntityInfos>().name];
                            },
                            [&](Entity *e)
                            {
                                return NoiseTester::priority2 == NoiseTester::entries[e->comp<EntityInfos>().name] ? 0. : 1.;
                            },
                            -0.5f,
                            VulpineColorUI::HightlightColor2,
                            0.075f
                        )
                    })
                ),
                
                newEntity("Control & Color Parent"
                    , UI_BASE_COMP
                    , WidgetBox()
                    , WidgetStyle()
                        .setautomaticTabbing(2)
                    , EntityGroupInfo({
                        newEntity("Entries Color Selection"
                            , UI_BASE_COMP
                            , WidgetBox()
                            , WidgetStyle()
                                .setautomaticTabbing(1)
                                .setuseInternalSpacing(false)
                            , EntityGroupInfo({
                                VulpineBlueprintUI::ColorSelectionScreen("Entry 1 Color",
                                    [](){return NoiseTester::color1;},
                                    [](vec3 color){NoiseTester::color1 = color;}
                                ),
                                VulpineBlueprintUI::ColorSelectionScreen("Entry 2 Color",
                                    [](){return NoiseTester::color2;},
                                    [](vec3 color){NoiseTester::color2 = color;}
                                )
                            })
                        ),
                        controlsEntity = newEntity("Control Parent"
                            , UI_BASE_COMP
                            , WidgetBox()
                            , WidgetStyle()
                                .setautomaticTabbing(1)
                            , EntityGroupInfo()
                        )
                    })
                )
            })  
        )
    );

    addNoiseViewers();

    
    WidgetBox::smoothingAnimationSpeed = 20;


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
            static float lastTime = 0.;
            float now = globals.appTime.getElapsedTime();

            // if (itcnt % 50 == 0)
            if(now-lastTime > 1)
            {
                lastTime = now;

                // system("clear");
                std::cout << TERMINAL_INFO << "\n\n####> Refreshing ALL shaders...\n" << TERMINAL_RESET;

                ui.fontMaterial->reset();
                defaultSUIMaterial->reset();
                finalProcessingStage.reset();

                for (auto &m : Loader<MeshMaterial>::loadedAssets)
                    m.second->reset();
            }
        }
        
        /* UI Update */
        WidgetUI_Context uiContext = WidgetUI_Context(&ui);
        updateEntityCursor(globals.mousePosition(), globals.mouseLeftClickDown(), globals.mouseLeftClick(), VulpineBlueprintUI::UIcontext, false);
        ComponentModularity::synchronizeChildren(rootEntity);
        updateWidgetsStyle();

        static vec2 windowsSizeTmp(1024);
        static ivec2 windowsResizeCapture(1024);
        static int screenshotFrameWait = 0;
        
        static std::string currentNoiseTMP;
        if(doMipMapGeneration)
        {
            if(!doScreenshot && !doResize)
            {
                if(windowsResizeCapture.x == 1024)
                {
                    currentNoiseTMP = currentNoise;
                }

                // else
                if(windowsResizeCapture.x == 512)
                {   
                    static std::vector<u8vec3> ground(512*512);

                    #define STBIR_DEFAULT_FILTER_DOWNSAMPLE   STBIR_FILTER_CUBICBSPLINE
                    
                    for(int r = 512; r >= 64; r /= 2)
                    {
                        stbir_resize_uint8(
                            (uint8*)screen2D.data(), screen2Dres.x, screen2Dres.y, 0,
                            (uint8*)ground.data(), r, r, 0, 3 
                        );
    
                        stbi_write_png(
                            ("results/mipmaps/" + std::to_string(r) + "_ground.png").c_str(),
                            r,
                            r,
                            3,
                            ground.data(), 
                            0
                        );
                    }
                }

                windowsResizeCapture /= 2;
                currentNoise = "mipmaps/" + std::to_string(windowsResizeCapture.x);

                if(windowsResizeCapture.x < 64)
                {
                    doMipMapGeneration = false;
                    windowsResizeCapture = ivec2(1024);
                    glfwSetWindowSize(window, windowsSizeTmp.x, windowsSizeTmp.y);
                    currentNoise = currentNoiseTMP;

                    static std::vector<u8vec3> ground(512*512);
                    static std::vector<u8vec3> ours(512*512);

                    for(int r = 256; r >= 64; r /= 2)
                    {
                        int tmp;
                        u8vec3* ground = (u8vec3*) stbi_load(
                            ("results/mipmaps/" + std::to_string(r) + "_ground.png").c_str(), &tmp, &tmp, &tmp, 3
                        );

                        u8vec3* ours = (u8vec3*) stbi_load(
                            ("results/mipmaps/" + std::to_string(r) + ".png").c_str(), &tmp, &tmp, &tmp, 3
                        );

                        for(int i = 0; i < r*r; i++)
                        {
                            float d = .5*round(distance(vec3(ours[i]), vec3(ground[i])))/sqrt(255*255*3);

                            if(i%r < 5)
                            {
                                d = (float)(i/r)/(float)(r);
                            }

                            vec3 c(0);
                            
                            c = mix(c, vec3(0, 0, 1), smoothstep(0.f, 0.075f,  d*2.f));
                            c = mix(c, vec3(0, 1, 0), smoothstep(0.075f, 0.125f, d*2.f));
                            c = mix(c, vec3(1, 1, 0), smoothstep(0.125f, 0.25f, d*2.f));
                            c = mix(c, vec3(1, 0, 0), smoothstep(0.25f, 0.5f, d*2.f));
                            c = mix(c, vec3(1, 0, 1), smoothstep(0.5f, 1.f, d*2.f));

                            // c = vec3(abs(vec3(ours[i])- vec3(ground[i])))/255.f;
                            // c = vec3(clamp(d, 0.f, 1.f));


                            ours[i] = u8vec3(round(c*255.f));
                        }
                        stbi_flip_vertically_on_write(false);
                        stbi_write_png(
                            ("results/mipmaps/" + std::to_string(r) + "_difference.png").c_str(),
                            r, r, 3, ours, 0);

                        stbi_image_free(ground);
                        stbi_image_free(ours);
                    }
                }
                else
                    doResize = true;
            }
        }


        if(doScreenshot)
        {
            screenshotFrameWait --;
            if(!screenshotFrameWait)
            {
                stbi_flip_vertically_on_write(true);

                stbi_write_png(
                    ("results/" + currentNoise + ".png").c_str(),
                    screen2Dres.x,
                    screen2Dres.y,
                    3,
                    screen2D.data(), 
                    0
                );

                glfwSetWindowSize(window, windowsSizeTmp.x, windowsSizeTmp.y);
                rootEntity->comp<WidgetBox>().set(vec2(-1, 1), vec2(-1, 1));
                WidgetBox::tabbingSpacingScale = vec2(1.);

                doScreenshot = false;
            }
        }
        if(doResize)
        {
            // resizeCallback(window, 2000, 1000);
            rootEntity->comp<WidgetBox>().set(vec2(-3, 1), vec2(-1, 1));
            WidgetBox::tabbingSpacingScale = vec2(0.);
            glfwSetWindowSize(window, windowsResizeCapture.x, windowsResizeCapture.y);
            doResize = false;
            doScreenshot = true;
            windowsSizeTmp = globals.windowSize();

            screenshotFrameWait = 50;
        }

        mainloopPreRenderRoutine();

        // std::cout << 1000.f / globals.appTime.getLastAvg().count() << "\n";

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

        /* Retreiving the 2D scene RGB values */
        auto &screenTexture = screenBuffer2D.getTexture(0);
        screen2Dres = screenTexture.getResolution();
        // NOTIF_MESSAGE(vec2(screen2Dres));
        screen2D.resize(screen2Dres.x * screen2Dres.y);
        screenTexture.bind(0);
        glGetTexImage(GL_TEXTURE_2D, 0, GL_RGB, GL_UNSIGNED_BYTE, screen2D.data());

        /* Main loop End */
        mainloopEndRoutine();
    }
}