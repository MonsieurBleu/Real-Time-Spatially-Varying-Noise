#include <NoiseTester.hpp>
#include <filesystem>
#include <AssetManager.hpp>
#include <AssetManagerUtils.hpp>
#include <Utils.hpp>
#include <Helpers.hpp>

#include <NoiseEntity.hpp>
#include <Blueprint/EngineBlueprintUI.hpp>

#define MLO Loader<MeshMaterial>::loadingInfos

EntityRef SimpleFloatingText(
    const std::string &name
    )
{
    auto t = newEntity(name
        , UI_BASE_COMP
        , WidgetBox()
        // , WidgetBackground()
        , WidgetStyle()
            .setbackGroundStyle(UiTileType::SQUARE_ROUNDED)
            .setbackgroundColor1(VulpineColorUI::DarkBackgroundColor1)
            .setbackgroundColor2(VulpineColorUI::DarkBackgroundColor2)
            .settextColor1(VulpineColorUI::LightBackgroundColor1)
            .settextColor2(VulpineColorUI::HightlightColor1)
        , WidgetText(U"0.00")
    );

    t->set<WidgetButton>(WidgetButton(
        WidgetButton::Type::TEXT_INPUT,
        [](Entity *e, float v)
        {
        },
        [](Entity *e)
        {
            return 0.f;
        }
    ));

    // t->comp<WidgetText>().mesh->state.setRotation(vec3(0, 0, radians(90.f)));

    return t;
}


void NoiseTester::createNoisesMaterials()
{
    for (auto f : std::filesystem::recursive_directory_iterator("data/noises/"))
    {
        if (f.is_directory())
            continue;

        std::string ext = f.path().extension().string();
        std::string path = f.path().string().c_str();
        std::string name = getNameOnlyFromPath(path.c_str());

        if (!strcmp(ext.c_str(), ".frag"))
        {
            

            std::string name2D = name + " - 2D";
            if(MLO.find(name + "2D") == MLO.end())
            {
                std::string filename = "data/noises/auto/" + name2D + ".vulpineMaterial";

                std::fstream file("data/noises/auto/" + name2D + ".vulpineMaterial", std::ios::out);
                file << "\"" << name2D << "\"" 
                     << "\n:\t" << "\"" << name2D << "\""  
                     << "\n\t: uniforms 2D\n\t: \"" << path << "\""
                     << "\n\t: data/noises/noise2D.vert\n\t;\n;"
                     ;
                file.close();

                Loader<MeshMaterial>::addInfos(filename.c_str());

                NOTIF_MESSAGE("Sucesfully created noise material " << name2D);
            }
        }
    }

    // for(auto &i : MLO)
    //     std::cout << i.first << "\n";
}

NoiseTester::NoiseTesterGroup NoiseTester::noiseSprite(const std::string &materialName, vec2 xrange, vec2 yrange)
{
    ModelRef sprite = newModel(Loader<MeshMaterial>::get(materialName));
    sprite->noBackFaceCulling = true;
    sprite->state.frustumCulled = false;
    // data.sprite->depthWrite = false;

    sprite->setMap(0, Loader<Texture2D>::get("alt_PavingStones_C"));
    sprite->setMap(1, Loader<Texture2D>::get("PavingStones_P"));
    sprite->setMap(2, Loader<Texture2D>::get("PavingStones_P2"));

    sprite->setMap(3, Loader<Texture2D>::get("Ground_C"));
    sprite->setMap(4, Loader<Texture2D>::get("Ground_P"));
    sprite->setMap(5, Loader<Texture2D>::get("Ground_P2"));

    sprite->setMap(6, Loader<Texture2D>::get("Rock_C"));
    sprite->setMap(7, Loader<Texture2D>::get("Rock_P"));
    sprite->setMap(8, Loader<Texture2D>::get("Rock_P2"));

    // sprite->setMap(0, Loader<Texture2D>::get("muscle_C"));
    // sprite->setMap(1, Loader<Texture2D>::get("muscle_P"));
    // sprite->setMap(2, Loader<Texture2D>::get("muscle_P"));

    // sprite->setMap(3, Loader<Texture2D>::get("graisse_C"));
    // sprite->setMap(4, Loader<Texture2D>::get("graisse_P"));
    // sprite->setMap(5, Loader<Texture2D>::get("graisse_P"));

    // sprite->setMap(6, Loader<Texture2D>::get("os_C"));
    // sprite->setMap(7, Loader<Texture2D>::get("os_P"));
    // sprite->setMap(8, Loader<Texture2D>::get("os_P"));

    sprite->uniforms.add(ShaderUniform(&NoiseTester::entry1, 35));
    sprite->uniforms.add(ShaderUniform(&NoiseTester::entry2, 36));

    sprite->uniforms.add(ShaderUniform(&NoiseTester::priority1, 37));
    sprite->uniforms.add(ShaderUniform(&NoiseTester::priority2, 38));

    sprite->uniforms.add(ShaderUniform(&NoiseTester::color1, 39));
    sprite->uniforms.add(ShaderUniform(&NoiseTester::color2, 40));

    sprite->uniforms.add(ShaderUniform(&NoiseTester::baseVariance, 41));

    sprite->uniforms.add(ShaderUniform(&NoiseTester::alpha, 42));

    sprite->uniforms.add(ShaderUniform(&NoiseTester::gridAlphaMode, 43));

    sprite->uniforms.add(ShaderUniform(&NoiseTester::method, 44));

    sprite->uniforms.add(ShaderUniform(&NoiseTester::invertPriotiy, 45));
    sprite->uniforms.add(ShaderUniform(&NoiseTester::invertEntry, 46));

    sprite->uniforms.add(ShaderUniform(&NoiseTester::output, 47));

    sprite->uniforms.add(ShaderUniform(&NoiseTester::varianceMethod, 48));

    sprite->uniforms.add(ShaderUniform(&NoiseTester::view, 49));

    sprite->uniforms.add(ShaderUniform(&NoiseTester::gridVarianceMode, 50));

    sprite->uniforms.add(ShaderUniform(&NoiseTester::priorityMethod, 51));


    GenericSharedBuffer buff(new char[sizeof(vec3)*6]);
    vec3 *pos = (vec3*)buff.get();

    int id = 0;

    pos[id++] = vec3(0, 0, 0);
    pos[id++] = vec3(1, -1, 0);
    pos[id++] = vec3(1, 0, 0);

    pos[id++] = vec3(0, 0, 0);
    pos[id++] = vec3(0, -1, 0);
    pos[id++] = vec3(1, -1, 0);

    sprite->setVao(new
        VertexAttributeGroup({
            VertexAttribute(buff, 0, 6, 3, GL_FLOAT, false)
        })
    );

    sprite->getVao()->generate();
    // sprite.sprite->setMap(0, Loader<Texture2D>::get(data.name));
    sprite->state.scaleScalar(0);

    // TODO : add ranges uniforms
    // sprite->uniforms.add(ShaderUniform(xrange, 32));
    // sprite->uniforms.add(ShaderUniform(yrange, 33));

    
    
    WidgetBox box;
    // box.useClassicInterpolation = true;
    
    EntityRef noiseView = newEntity(materialName + " - Vizualazer"
        , UI_BASE_COMP
        , box
        , WidgetStyle()
        , WidgetSprite(sprite)
        , WidgetRenderInfos()
        , FigureInfo()
    );

    FigureInfo *fi = &noiseView->comp<FigureInfo>();
    noiseView->comp<WidgetSprite>().sprite->uniforms.add(ShaderUniform(&fi->range, 32));
    noiseView->comp<WidgetSprite>().sprite->uniforms.add(ShaderUniform(&fi->range, 33));
    noiseView->comp<WidgetSprite>().sprite->uniforms.add(ShaderUniform(&fi->gridSize, 34));

    noiseView->comp<WidgetBox>().set(vec2(-1+textMargin*2., 1), vec2(-1, 1-textMargin*2.));

    EntityRef rowsText;
    EntityRef columnsText;

    EntityRef noiseViewParent = newEntity(materialName + " - Noise View Parent"
        , UI_BASE_COMP
        , WidgetBox()
        , EntityGroupInfo({
            noiseView,
            rowsText = newEntity("Rows Text"
                , UI_BASE_COMP
                , WidgetBox(vec2(-1, -1+textMargin*2.), vec2(-1, 1-textMargin*2.))
                , WidgetStyle().setautomaticTabbing(1)
            ),
            columnsText = newEntity("Columns Text"
                , UI_BASE_COMP
                , WidgetBox(vec2(-1+textMargin*2., 1), vec2(1-textMargin*2., 1.))
                , WidgetStyle().setautomaticTabbing(1)
            )
        })
    );

    for(int i = 0; i < 1; i++)
    {
        ComponentModularity::addChild(
            *rowsText, 
            SimpleFloatingText("entry")
        );
        
        ComponentModularity::addChild(
            *columnsText, 
            SimpleFloatingText("entry")
        );
    }
    rowsText->comp<WidgetStyle>().setautomaticTabbing(1);

    #define MAX_GRID_SIZE 6
    #define MAX_ZOOM_LEVEL 10

    Entity *rowsPTR = rowsText.get();
    Entity *columnsPTR = columnsText.get();

    EntityRef Controls = newEntity(materialName + " - Controls"
        , UI_BASE_COMP
        , WidgetBox()
        , WidgetStyle()
            .setautomaticTabbing(7)
        , EntityGroupInfo({

            // newEntity("space"),

            VulpineBlueprintUI::NamedEntry(U"Rows", 
                VulpineBlueprintUI::ValueInputSlider("Rows", 1, MAX_GRID_SIZE, MAX_GRID_SIZE-1, 
                    [fi, rowsPTR](float v)
                    {
                        fi->gridSize.y = v;

                        // auto &c = rowsPTR->comp<EntityGroupInfo>().children;
                        
                        // int diff = (int)fi->gridSize.y - c.size();
                        // if(diff > 0)
                        //     for(int i = 0; i < diff; i++) 
                        //         ComponentModularity::addChild(*rowsPTR, SimpleFloatingText("entry"));
                        // else
                        //     for(int i = 0; i < -diff; i++)
                        //         c.pop_back();
                                
                        // rowsPTR->comp<WidgetStyle>().setautomaticTabbing(fi->gridSize.y);
                        
                        ManageGarbage<WidgetBackground>(); ManageGarbage<WidgetSprite>(); ManageGarbage<WidgetText>();
                    }, 
                    [fi](){return fi->gridSize.y;})
            ),
            VulpineBlueprintUI::NamedEntry(U"Columns", 
                VulpineBlueprintUI::ValueInputSlider("Columns", 1, MAX_GRID_SIZE, MAX_GRID_SIZE-1, 
                    [fi, columnsPTR](float v)
                    {
                        fi->gridSize.x = v;

                        // auto &c = columnsPTR->comp<EntityGroupInfo>().children;
                        
                        // int diff = (int)fi->gridSize.x - c.size();
                        // if(diff > 0)
                        //     for(int i = 0; i < diff; i++) 
                        //         ComponentModularity::addChild(*columnsPTR, SimpleFloatingText("entry"));
                        // else
                        //     for(int i = 0; i < -diff; i++)
                        //         c.pop_back();
                        
                        ManageGarbage<WidgetBackground>(); ManageGarbage<WidgetSprite>(); ManageGarbage<WidgetText>();
                    }, 
                    [fi](){return fi->gridSize.x;})
            ),
            VulpineBlueprintUI::NamedEntry(U"Zoom Level", 
                VulpineBlueprintUI::ValueInputSlider("Zoom", 0, MAX_ZOOM_LEVEL, MAX_ZOOM_LEVEL, 
                    [fi](float v){fi->range.x = fi->range.y = pow(2., v);}, 
                    [fi](){return log2(fi->range.y);}
                )
            ),

            // newEntity("space"),
            
            VulpineBlueprintUI::NamedEntry(U"Base Variance", 
                VulpineBlueprintUI::ValueInputSlider(
                    "Base Variance", 0, 1, 1e3, [](float v){NoiseTester::baseVariance = v;}, [](){return NoiseTester::baseVariance;})
            ),

            VulpineBlueprintUI::NamedEntry(U"Alpha", 
                VulpineBlueprintUI::ValueInputSlider(
                    "Alpha", 0, 1, 1e3, [](float v){NoiseTester::alpha= v; gridAlphaMode = 0;}, [](){return NoiseTester::alpha;}
                )
            ),

            newEntity("Advanced Priority Options"
                , UI_BASE_COMP
                , WidgetBox()
                , WidgetStyle()
                    .setautomaticTabbing(1)
                    .setuseInternalSpacing(false)
                , EntityGroupInfo({
                    VulpineBlueprintUI::Toggable("Invert Priority 1", "", 
                        [](Entity *e, float v){invertPriotiy.x = !invertPriotiy.x;},
                        [](Entity *e){return invertPriotiy.x ? 0.f : 1.;}
                        , VulpineColorUI::HightlightColor6
                    ),
                    VulpineBlueprintUI::Toggable("Invert Priority 2", "", 
                        [](Entity *e, float v){invertPriotiy.y = !invertPriotiy.y;},
                        [](Entity *e){return invertPriotiy.y ? 0.f : 1.;}
                        , VulpineColorUI::HightlightColor6
                    ),
                })
            ),

            newEntity("Advanced Entry Options"
                    , UI_BASE_COMP
                    , WidgetBox()
                    , WidgetStyle()
                        .setautomaticTabbing(1)
                        .setuseInternalSpacing(false)
                    , EntityGroupInfo({
                        VulpineBlueprintUI::Toggable("Invert Entry 1", "", 
                            [](Entity *e, float v){invertEntry.x = !invertEntry.x;},
                            [](Entity *e){return invertEntry.x ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor6
                        ),
                        VulpineBlueprintUI::Toggable("Invert Entry 2", "", 
                            [](Entity *e, float v){invertEntry.y = !invertEntry.y;},
                            [](Entity *e){return invertEntry.y ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor6
                        ),
                    })
                ),

            VulpineBlueprintUI::NamedEntry(U"Weight Method",
                newEntity("Methode"
                    , UI_BASE_COMP
                    , WidgetBox()
                    , WidgetStyle()
                        .setautomaticTabbing(1)
                        .setuseInternalSpacing(false)
                    , EntityGroupInfo({
                        VulpineBlueprintUI::Toggable("Linear", "", 
                            [](Entity *e, float v){method = 0;},
                            [](Entity *e){return method == 0 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor6
                        ),
                        VulpineBlueprintUI::Toggable("FS24", "", 
                            [](Entity *e, float v){method = 1;},
                            [](Entity *e){return method == 1 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor6
                        ),
                        VulpineBlueprintUI::Toggable("CL25", "", 
                            [](Entity *e, float v){method = 2;},
                            [](Entity *e){return method == 2 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor6
                        ),
                        VulpineBlueprintUI::Toggable("[X]", "", 
                            [](Entity *e, float v){method = -1;},
                            [](Entity *e){return method == -1 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor4
                        ),
                        VulpineBlueprintUI::Toggable("[Y]", "", 
                            [](Entity *e, float v){method = -2;},
                            [](Entity *e){return method == -2 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor4
                        ),
                    })
                ), 0.33f
            ),

            VulpineBlueprintUI::NamedEntry(U"Variance Method",
                newEntity("Methode"
                    , UI_BASE_COMP
                    , WidgetBox()
                    , WidgetStyle()
                        .setautomaticTabbing(1)
                        .setuseInternalSpacing(false)
                    , EntityGroupInfo({
                        VulpineBlueprintUI::Toggable("Ground", "", 
                            [](Entity *e, float v){varianceMethod = 0;},
                            [](Entity *e){return varianceMethod == 0 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor6
                        ),
                        VulpineBlueprintUI::Toggable("FS24", "", 
                            [](Entity *e, float v){varianceMethod = 1;},
                            [](Entity *e){return varianceMethod == 1 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor6
                        ),
                        VulpineBlueprintUI::Toggable("CL25", "", 
                            [](Entity *e, float v){varianceMethod = 2;},
                            [](Entity *e){return varianceMethod == 2 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor6
                        ),
                        VulpineBlueprintUI::Toggable("[X]", "", 
                            [](Entity *e, float v){varianceMethod = -1;},
                            [](Entity *e){return varianceMethod == -1 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor4
                        ),
                        VulpineBlueprintUI::Toggable("[Y]", "", 
                            [](Entity *e, float v){varianceMethod = -2;},
                            [](Entity *e){return varianceMethod == -2 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor4
                        ),
                    })
                ), 0.33f
            ),

            VulpineBlueprintUI::NamedEntry(U"Priority Method",
                newEntity("Methode"
                    , UI_BASE_COMP
                    , WidgetBox()
                    , WidgetStyle()
                        .setautomaticTabbing(1)
                        .setuseInternalSpacing(false)
                    , EntityGroupInfo({
                        VulpineBlueprintUI::Toggable("FS24", "", 
                            [](Entity *e, float v){priorityMethod = 0;},
                            [](Entity *e){return priorityMethod == 0 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor6
                        ),
                        VulpineBlueprintUI::Toggable("CL25", "", 
                            [](Entity *e, float v){priorityMethod = 1;},
                            [](Entity *e){return priorityMethod == 1 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor6
                        ),
                        VulpineBlueprintUI::Toggable("[X]", "", 
                            [](Entity *e, float v){priorityMethod = -1;},
                            [](Entity *e){return priorityMethod == -1 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor4
                        ),
                        VulpineBlueprintUI::Toggable("[Y]", "", 
                            [](Entity *e, float v){priorityMethod = -2;},
                            [](Entity *e){return priorityMethod == -2 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor4
                        ),
                    })
                ), 0.33f
            ),

            VulpineBlueprintUI::NamedEntry(U"View",
                newEntity("Methode"
                    , UI_BASE_COMP
                    , WidgetBox()
                    , WidgetStyle()
                        .setautomaticTabbing(1)
                        .setuseInternalSpacing(false)
                    , EntityGroupInfo({
                        VulpineBlueprintUI::Toggable("Flat", "", 
                            [](Entity *e, float v){view = 0;},
                            [](Entity *e){return view == 0 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor6
                        ),
                        VulpineBlueprintUI::Toggable("Surface", "", 
                            [](Entity *e, float v){view = 1;},
                            [](Entity *e){return view == 1 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor6
                        ),
                        VulpineBlueprintUI::Toggable("[X]", "", 
                            [](Entity *e, float v){view = -1;},
                            [](Entity *e){return view == -1 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor4
                        ),
                        VulpineBlueprintUI::Toggable("[Y]", "", 
                            [](Entity *e, float v){view = -2;},
                            [](Entity *e){return view == -2 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor4
                        ),
                    })
                ), 0.33f
            ),

            VulpineBlueprintUI::NamedEntry(U"Output",
                newEntity("Methode"
                    , UI_BASE_COMP
                    , WidgetBox()
                    , WidgetStyle()
                        .setautomaticTabbing(1)
                        .setuseInternalSpacing(false)
                    , EntityGroupInfo({
                        VulpineBlueprintUI::Toggable("Blending", "", 
                            [](Entity *e, float v){output = 0;},
                            [](Entity *e){return output == 0 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor6
                        ),
                        VulpineBlueprintUI::Toggable("Weight", "", 
                            [](Entity *e, float v){output = 1;},
                            [](Entity *e){return output == 1 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor6
                        ),
                        VulpineBlueprintUI::Toggable("LOD", "", 
                            [](Entity *e, float v){output = 2;},
                            [](Entity *e){return output == 2 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor6
                        ),
                        VulpineBlueprintUI::Toggable("[X]", "", 
                            [](Entity *e, float v){output = -1;},
                            [](Entity *e){return output == -1 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor4
                        ),
                        VulpineBlueprintUI::Toggable("[Y]", "", 
                            [](Entity *e, float v){output = -2;},
                            [](Entity *e){return output == -2 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor4
                        ),
                    })
                ), 0.33f
            ),

            VulpineBlueprintUI::NamedEntry(U"Alpha Gradient",
                newEntity("Advanced Alpha Options"
                    , UI_BASE_COMP
                    , WidgetBox()
                    , WidgetStyle()
                        .setautomaticTabbing(1)
                        .setuseInternalSpacing(false)
                    , EntityGroupInfo({
                        VulpineBlueprintUI::Toggable("H", "", 
                            [](Entity *e, float v){
                                    alpha = 0.f;
                                    gridAlphaMode = -1;
                            },
                            [](Entity *e){return gridAlphaMode == -1 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor6
                        ),
                        VulpineBlueprintUI::Toggable("V", "", 
                            [](Entity *e, float v){
                                    alpha = 0.f;
                                    gridAlphaMode = -2;
                            },
                            [](Entity *e){return gridAlphaMode == -2 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor6
                        ),
                        VulpineBlueprintUI::Toggable("[X]", "", 
                            [](Entity *e, float v){
                                    alpha = 0.f;
                                    gridAlphaMode = 1;
                            },
                            [](Entity *e){return gridAlphaMode == 1 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor4
                        ),
                        VulpineBlueprintUI::Toggable("[Y]", "", 
                            [](Entity *e, float v){
                                    alpha = 0.f;
                                    gridAlphaMode = 2;
                            },
                            [](Entity *e){return gridAlphaMode == 2 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor4
                        ),
                    })
                ), 0.33f
            ),

            VulpineBlueprintUI::NamedEntry(U"Variance Gradient",
                newEntity("Advanced Alpha Options"
                    , UI_BASE_COMP
                    , WidgetBox()
                    , WidgetStyle()
                        .setautomaticTabbing(1)
                        .setuseInternalSpacing(false)
                    , EntityGroupInfo({
                        VulpineBlueprintUI::Toggable("H", "", 
                            [](Entity *e, float v){
                                    baseVariance = -1.f;
                                    gridVarianceMode = -1;
                            },
                            [](Entity *e){return baseVariance == -1. && gridVarianceMode == -1 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor6
                        ),
                        VulpineBlueprintUI::Toggable("V", "", 
                            [](Entity *e, float v){
                                    baseVariance = -1.f;
                                    gridVarianceMode = -2;
                            },
                            [](Entity *e){return baseVariance == -1. && gridVarianceMode == -2 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor6
                        ),
                        VulpineBlueprintUI::Toggable("[X]", "", 
                            [](Entity *e, float v){
                                    baseVariance = -1.f;
                                    gridVarianceMode = 1;
                            },
                            [](Entity *e){return baseVariance == -1. && gridVarianceMode == 1 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor4
                        ),
                        VulpineBlueprintUI::Toggable("[Y]", "", 
                            [](Entity *e, float v){
                                    baseVariance = -1.f;
                                    gridVarianceMode = 2;
                            },
                            [](Entity *e){return baseVariance == -1. && gridVarianceMode == 2 ? 0.f : 1.;}
                            , VulpineColorUI::HightlightColor4
                        ),
                    })
                ), 0.33f
            ),
            

        })
    );

    auto noiseViewParentPTR = noiseViewParent.get();
    auto noiseViewPTR = noiseView.get();

    EntityRef histparent = newEntity(materialName +" - Histogram Parent View"
        , UI_BASE_COMP
        , WidgetBox()
        , WidgetStyle()
            .setautomaticTabbing(3)
        , EntityGroupInfo()
        );
    

    for(auto i = 0; i < 3; i++)
    {
        vec4 color(0, 0, 0, 0.5);
        color[i] = 1;

        EntityRef renderInfos = newEntity(materialName + " - Render Info View"
            , UI_BASE_COMP
            , WidgetBox()
            , WidgetStyle()
                .setautomaticTabbing(1)
            , EntityGroupInfo({
                newEntity(materialName + " - Histogram View"
                    , UI_BASE_COMP
                    , WidgetSprite(PlottingHelperRef(new PlottingHelper(color, 256)))
                    , WidgetBox(
                        [noiseViewPTR, i](Entity *parent, Entity *child)
                        {
                            PlottingHelper* p = (PlottingHelper*)child->comp<WidgetSprite>().sprite.get();
                            auto &rinfos = noiseViewPTR->comp<WidgetRenderInfos>();

                            p->maxv = 0;
                            p->minv = 0;

                            for(int j = 0; j < 256; j++)
                            {
                                float v = rinfos.hist[j][i];
                                
                                // if(j == 0 || j == 1 || j == 255 || j == 254) v = 0.f;
                                
                                p->push(v);
                                p->maxv = max(v, p->maxv);
                                // p->maxv = .;
                            }

                            p->updateData();
                        }
                    )
                ),
                newEntity(materialName + " - Scalar Stats View"
                    , UI_BASE_COMP
                    , WidgetBox()
                    , WidgetStyle().setautomaticTabbing(5)
                    , EntityGroupInfo({
                        VulpineBlueprintUI::ColoredConstEntry("Esperance",  [noiseViewPTR, i](){return ftou32str(noiseViewPTR->comp<WidgetRenderInfos>().avg[i], 5);}),
                        // VulpineBlueprintUI::ColoredConstEntry("Variance",   [noiseViewPTR, i](){return ftou32str(noiseViewPTR->comp<WidgetRenderInfos>().var[i], 5);}),
                        VulpineBlueprintUI::ColoredConstEntry("Deviation",  [noiseViewPTR, i](){return ftou32str(noiseViewPTR->comp<WidgetRenderInfos>().dev[i], 5);}),

                        VulpineBlueprintUI::ColoredConstEntry("Median",     [noiseViewPTR, i](){return ftou32str(noiseViewPTR->comp<WidgetRenderInfos>().med[i], 5);}),
                        VulpineBlueprintUI::ColoredConstEntry("Low 4th",    [noiseViewPTR, i](){return ftou32str(noiseViewPTR->comp<WidgetRenderInfos>().l4th[i], 5);}),
                        VulpineBlueprintUI::ColoredConstEntry("High 4th",   [noiseViewPTR, i](){return ftou32str(noiseViewPTR->comp<WidgetRenderInfos>().h4th[i], 5);}),
                        
                    })
                )
            })
        );

        ComponentModularity::addChild(
            *histparent, renderInfos
        );
    }


    EntityRef parent = newEntity(materialName +" - Parent View"
        , UI_BASE_COMP
        , WidgetBox()
        , WidgetStyle()
            .setautomaticTabbing(2)
        , EntityGroupInfo({
            noiseViewParent, 
            histparent
        })
        );
    
        
    Entity *parentPTR = parent.get();
    Entity *histparentPTR = histparent.get();
    
    // histparentPTR->comp<WidgetState>().status = ModelStatus::HIDE;

    noiseView->set<WidgetButton>(
        WidgetButton(
            WidgetButton::Type::CHECKBOX,
            [parentPTR, histparentPTR, noiseViewParentPTR](Entity *e, float f)
            {
                auto &ws = parentPTR->comp<WidgetStyle>();
                
                ws.setautomaticTabbing(ws.automaticTabbing ? 0 : 2);
                
                histparentPTR->comp<WidgetState>().statusToPropagate = ws.automaticTabbing ? ModelStatus::SHOW : ModelStatus::HIDE;

                // histparentPTR->comp<WidgetState>().statusToPropagate

                // histparentPTR->comp<WidgetState>().status = ModelStatus::HIDE;

                // NOTIF_MESSAGE(ws.automaticTabbing);

                noiseViewParentPTR->comp<WidgetBox>().set(vec2(-1, 1), vec2(-1, 1));
            },
            [](Entity *e){return 0.f;}
        )
    );

    NoiseTester::NoiseTesterGroup r;
    r.visual = parent;
    r.controls = Controls;

    return r;
}