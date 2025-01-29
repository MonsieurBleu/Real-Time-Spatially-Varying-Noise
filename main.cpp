#include <Launcher.hpp>
#include <NoiseApp.hpp>

/**
 * To be executed by the launcher, the Game class needs :
 * 
 *  - Constructor of type (void)[GLFWwindow*].
 * 
 *  - init method of type (any)[params ...] with 
 *    launchgame call of type (**Game, string, params).
 * 
 *  - mainloop method of type (any)[void].
 */

int main()
{
    NoiseApp *app = nullptr;
    std::string winname =  "Real Time Spatially Varying Noise";
    int ret = launchGame(&app, winname, 5);
    if(app) delete app;
    return ret; 
}