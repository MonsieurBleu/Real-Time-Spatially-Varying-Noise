#include <NoiseEntity.hpp>
#include <Globals.hpp>

COMPONENT_DEFINE_SYNCH(WidgetRenderInfos)
{
    if(globals.appTime.getUpdateCounter()%10)
        return;

    auto &box = child->comp<WidgetBox>();
    auto &rinfo = child->comp<WidgetRenderInfos>();

    ivec2 pmin = ceil (vec2(screen2Dres)*(box.displayMin*0.5f + 0.5f));
    ivec2 pmax = floor(vec2(screen2Dres)*(box.displayMax*0.5f + 0.5f));

    // pmin += 20.f;
    // pmax -= 20.f;

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
    const int size = (pmax.x-pmin.x+1)*(pmax.y-pmin.y+1);
    const float isize = 1.0/(float)(size);

    // const std::vector<u8vec3> sortedPixels(size);

    for(auto &i : rinfo.hist)
        i = vec3(0);

    for(int y = pmin.y; y < pmax.y; y++)
    for(int x = pmin.x; x < pmax.x; x++)
    {
        int id = y*screen2Dres.x + x;
        u8vec3 c = screen2D[id];

        sum += c;

        for(int i = 0; i < 3; i++)
            rinfo.hist[c[i]][i] += 1;
        
        // sortedPixels[cnt++] = c;

        // screen2D[id] /= 4;
    }


    
    vec3 cnt(0);
    rinfo.h4th = vec3(-1);
    rinfo.l4th = vec3(-1);
    rinfo.med = vec3(-1);

    for(int i = 0; i < 256; i++)
    {
        rinfo.hist[i] *= isize;

        cnt += rinfo.hist[i];
        for(int j = 0; j < 3; j++)
        {
            if(rinfo.l4th[j] == -1.f && cnt[j] >= 1.f/4.f)
                rinfo.l4th[j] = float(i)/255.;

            if(rinfo.h4th[j] == -1.f && cnt[j] >= 3.f/4.f)
                rinfo.h4th[j] = float(i)/255.;

            if(rinfo.med[j] == -1.f && cnt[j] >= .5)
                rinfo.med[j] = float(i)/255.;
        }
    }



    rinfo.avg = vec3(sum) * isize / 255.f;

    rinfo.dev = vec3(0);
    rinfo.var = vec3(0);

    for(int i = 0; i < 256; i++)
    {
        vec3 d = vec3(i)/255.f - rinfo.avg;  
        rinfo.var += d*d*rinfo.hist[i];
    }

    // rinfo.var *= isize;
    rinfo.dev = sqrt(rinfo.var);







    // if(globals.appTime.getUpdateCounter()%256 == 0)
    // {
    //     NOTIF_MESSAGE("255 : " << rinfo.hist[255]);
    //     NOTIF_MESSAGE("127 : " << rinfo.hist[127]);
    //     NOTIF_MESSAGE("0 : " << rinfo.hist[0]);
    // }


    // NOTIF_MESSAGE(pmin.x << " " << pmax.x << " | " << pmin.y << " " << pmax.y);
    // NOTIF_MESSAGE(vec2(screen2Dres));
}