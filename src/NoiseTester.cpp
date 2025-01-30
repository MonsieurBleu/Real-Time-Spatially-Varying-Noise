#include <NoiseTester.hpp>
#include <filesystem>
#include <AssetManager.hpp>
#include <AssetManagerUtils.hpp>
#include <Utils.hpp>

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
            

            std::string name2D = name + "2D";
            if(MLO.find(name + "2D") == MLO.end())
            {
                std::string filename = "data/noises/auto/" + name2D + ".vulpineMaterial";

                std::fstream file("data/noises/auto/" + name2D + ".vulpineMaterial", std::ios::out);
                file << name2D 
                     << "\n:\t" + name2D  
                     << "\n\t: uniforms 2D\n\t: data/noises/noise2D.vert\n\t: " 
                     << path << "\n\t;\n;";
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
    box.useClassicInterpolation = true;

    return newEntity(materialName + "Vizualazer"
        , UI_BASE_COMP
        , box
        , WidgetStyle()
        , WidgetSprite(sprite)
    );
}