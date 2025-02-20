#include <NoiseTester.hpp>
#include <filesystem>
#include <AssetManager.hpp>
#include <AssetManagerUtils.hpp>
#include <Utils.hpp>
#include <Helpers.hpp>

#include <NoiseEntity.hpp>
#include <Blueprint/EngineBlueprintUI.hpp>

#define MLO Loader<MeshMaterial>::loadingInfos

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

EntityRef NoiseTester::noiseSprite(const std::string &materialName, vec2 xrange, vec2 yrange)
{
    ModelRef sprite = newModel(Loader<MeshMaterial>::get(materialName));
    sprite->noBackFaceCulling = true;
    sprite->state.frustumCulled = false;
    // data.sprite->depthWrite = false;

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
    sprite->uniforms.add(ShaderUniform(xrange, 32));
    sprite->uniforms.add(ShaderUniform(yrange, 33));

    WidgetBox box;
    // box.useClassicInterpolation = true;

    EntityRef noiseView = newEntity(materialName + " - Vizualazer"
        , UI_BASE_COMP
        , box
        , WidgetStyle()
        , WidgetSprite(sprite)
        , WidgetRenderInfos()
    );

    noiseView->comp<WidgetBox>().set(vec2(-1, 1), vec2(-1, 1));

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
                    , WidgetSprite(PlottingHelperRef(new PlottingHelper(color, 254)))
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
                                p->push(v);
                                p->maxv = max(v, p->maxv);
                            }

                            p->updateData();
                        }
                    )
                ),
                newEntity(materialName + " - Scalar Stats View"
                    , UI_BASE_COMP
                    , WidgetBox()
                    , WidgetStyle().setautomaticTabbing(4)
                    , EntityGroupInfo({
                        VulpineBlueprintUI::ColoredConstEntry("AVG", 
                            [noiseViewPTR, i]()
                            {
                                return ftou32str(noiseViewPTR->comp<WidgetRenderInfos>().avg[i], 5);
                            }                        
                        ),
                        // VulpineBlueprintUI::ColoredConstEntry("ESP", 
                        //     [noiseViewPTR, i]()
                        //     {
                        //         return ftou32str(noiseViewPTR->comp<WidgetRenderInfos>().esp[i], 5);
                        //     }                        
                        // ),
                        VulpineBlueprintUI::ColoredConstEntry("VAR", 
                            [noiseViewPTR, i]()
                            {
                                return ftou32str(noiseViewPTR->comp<WidgetRenderInfos>().var[i], 5);
                            }
                        )
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
        , EntityGroupInfo({noiseView, 
            histparent
        })
        );
    
        
    Entity *parentPTR = parent.get();
    Entity *histparentPTR = histparent.get();
    
    // histparentPTR->comp<WidgetState>().status = ModelStatus::HIDE;

    noiseView->set<WidgetButton>(
        WidgetButton(
            WidgetButton::Type::CHECKBOX,
            [parentPTR, histparentPTR ](Entity *e, float f)
            {
                auto &ws = parentPTR->comp<WidgetStyle>();
                
                ws.setautomaticTabbing(ws.automaticTabbing ? 0 : 2);
                
                histparentPTR->comp<WidgetState>().statusToPropagate = ws.automaticTabbing ? ModelStatus::SHOW : ModelStatus::HIDE;

                // histparentPTR->comp<WidgetState>().statusToPropagate

                // histparentPTR->comp<WidgetState>().status = ModelStatus::HIDE;

                // NOTIF_MESSAGE(ws.automaticTabbing);

                e->comp<WidgetBox>().set(vec2(-1, 1), vec2(-1, 1));
            },
            [](Entity *e){return 0.f;}
        )
    );

    return parent;
}