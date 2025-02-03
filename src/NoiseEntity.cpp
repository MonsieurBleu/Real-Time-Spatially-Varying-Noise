#include <NoiseEntity.hpp>
#include <Globals.hpp>

COMPONENT_DEFINE_SYNCH(WidgetRenderInfos)
{
    // if(globals.appTime.getUpdateCounter()%100 != 99)
    //     return;

    auto &box = child->comp<WidgetBox>();
    auto &rinfo = child->comp<WidgetRenderInfos>();

    ivec2 pmin = ceil (vec2(screen2Dres)*(box.displayMin*0.5f + 0.5f));
    ivec2 pmax = floor(vec2(screen2Dres)*(box.displayMax*0.5f + 0.5f));

    {
        float tmp = pmin.y;
        pmin.y = screen2Dres.y - pmax.y;
        pmax.y = screen2Dres.y - tmp;
    }
    // {
    //     float tmp = pmin.x;
    //     pmin.x = screen2Dres.x - pmax.x;
    //     pmax.x = screen2Dres.x - tmp;
    // }


    vec3 sum;
    ivec2 size2D = pmax - pmin;
    const int size = (pmax.x-pmin.x)*(pmax.y-pmin.y);
    const float isize = 1.0/(float)(size);

    for(auto &i : rinfo.hist)
        i = vec3(0);

    for(int x = pmin.x; x < pmax.x; x++)
    for(int y = pmin.y; y < pmax.y; y++)
    {
        int id = y*screen2Dres.x + x;
        // int id = x*screen2Dres.y + y;
        u8vec3 c = screen2D[id];

        // NOTIF_MESSAGE(c);

        sum += c;

        for(int i = 0; i < 3; i++)
        {
            // NOTIF_MESSAGE(vec3(c));
            // NOTIF_MESSAGE(vec3(screen2D[10, 10]));
            rinfo.hist[c[i]][i] += 1;
        }
    }

    for(auto &i : rinfo.hist)
        i *= isize;

    rinfo.avg = vec3(sum) * isize;

    // NOTIF_MESSAGE(pmin.x << " " << pmax.x << " | " << pmin.y << " " << pmax.y);
    // NOTIF_MESSAGE(vec2(screen2Dres));
}