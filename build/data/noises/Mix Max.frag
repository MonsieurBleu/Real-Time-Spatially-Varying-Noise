#include ../../data/noises/utils.glsl
#include functions/FiltrableNoises.glsl

#define HIST_SIZE 32

layout (binding = 0) uniform sampler2D bTextures[9];

vec3 preservingMix(vec3 col1, vec3 avg1, vec3 col2, vec3 avg2, float alpha)
{
    // Variance preserving blending
    float ialpha = 1.-alpha;
    vec3 espf = avg1*alpha + avg2*ialpha;
    return espf + (col1*alpha + col2*ialpha - espf)/sqrt(ialpha*ialpha + alpha*alpha);
}

struct ProceduralProcess
{
    vec3 color;
    vec2 uv;
    float value;

    float priority;
    float prioritySquared;

    bool isTexture;

    float histogram[HIST_SIZE];
    float filtered;
};

float ProceduralPriority_HIST_SIZE(in out ProceduralProcess p)
{
    // float sv = p.value*(HIST_SIZE-2);
    // int id = int(floor(sv));   
    // return mix(p.histogram[id], p.histogram[id+1], fract(sv));

    float sv = p.value*(HIST_SIZE-1);
    int id = int(floor(sv)); 

    float v1 = id <= 0 ? 0. : p.histogram[id-1];

    float v2 = id >= HIST_SIZE ? 1. : p.histogram[id];
    return mix(v1, v2, fract(sv));
}

void FlattenMixedPriorty_case1(in out float po, float alpha)
{
    float alphaD = distance(alpha, .5);
    float d = (1. - sqrt(1. - 2.*alphaD));

    po = (po-d)/(1.-d);
    po *= po;
}

void FlattenMixedPriorty_case2(in out float po, float alpha)
{
    float alphaD = distance(alpha, .5);
    float d = (1. - sqrt(1. - 2.*alphaD));

    float m = d*d;
    float t = 2. - sqrt(2.*alphaD);

    if(po < 1.-d)
    {
        po += d;    
        po = (1.-t*d)*((po*po)-m)/(1.-m);
    }
    else
    {
        po = t*(po-(1.-d)) + 1.-t*d;
    }
}


vec2 MixMaxNaive_Flat(
    float v1, float p1, float m1,
    float v2, float p2, float m2,
    float alpha)
{
    float alphaD = distance(alpha, .5);
    float d = (1. - sqrt(1. - 2.*alphaD));
    float p1_shifted = p1 + sign(alpha-.5)*d;

    if(p1_shifted > p2)
    {
        if(alpha > .5)
            FlattenMixedPriorty_case2(p1, alpha);
        else
            FlattenMixedPriorty_case1(p1, alpha);
        
        return vec2(0., p1);
    }
    else
    {
        if(alpha > .5)
            FlattenMixedPriorty_case1(p2, alpha);
        else
            FlattenMixedPriorty_case2(p2, alpha);
        
        return vec2(1., p2);
    }
}

vec2 FS24_4(
    float v1, float p1, float m1,
    float v2, float p2, float m2,
    float alpha)
{
    float p1_shifted = p1 + alpha;
    float p2_shifted = p2 + 1.-alpha;

    if(p1_shifted > p2_shifted)
        return vec2(0., p1);
    else
        return vec2(1., p2);
}

float filtrage = 0.;

vec2 FS24_12(
    float v1, float p1, float m1,
    float v2, float p2, float m2,
    float alpha)
{   
    p2 += 2.0*(1.-alpha);
    p1 += 2.0*(alpha);

    filtrage = max(filtrage, 0.);

    float s = sqrt(m1*m1+m2*m2 + filtrage);

    float w = (p1 - p2)/s;

    return vec2(
        1.-clamp(.5 + .5*tanh(0.85*w), 0., 1.), 
        0.
        );
}

vec2 MixMaxMicro_Flat(
    float v1, float p1, float m1,
    float v2, float p2, float m2,
    float alpha)
{   
    float alphaD = distance(alpha, .5);
    float d = sign(alpha-.5)*(1. - sqrt(1. - 2.*alphaD));
    float s = sqrt(m1*m1+m2*m2);

    float iCDF = 0.125*atanh((alpha+alpha)-1.);

    float sf = -d/(.5 - alpha + iCDF);
    s = mix(s, sf, clamp(sqrt(filtrage)*2., 0., 1.));

    s = max(s, 1e-6);

    return vec2(
        clamp(.5 - (p1-p2 + d)/s - iCDF, 0., 1.)
        ,
        0.
        );
}

int _MixMax_choice = 0;
vec2 _MixMax_choicef(
    float v1, float p1, float m1,
    float v2, float p2, float m2,
    float alpha)
{
    switch(_MixMax_choice)
    {
        case 0 : return vec2(1.-alpha, 0.f);
        case 1 : return FS24_12(v1, p1, m1, v2, p2, m2, alpha);
        case 2 : return MixMaxMicro_Flat(v1, p1, m1, v2, p2, m2, alpha);
        // case 3 : return FS24_4(v1, p1, m1, v2, p2, m2, alpha);
        // case 4 : return MixMaxNaive_Flat(v1, p1, m1, v2, p2, m2, alpha);
        default : return vec2(0.);
    }
}

void main()
{
/***
    [0] ###### Defining View Parameters ########################### 
***/

    UV_PREPROCESS

    vec2 gridPos = vec2(floor(uv*gridSize)/(gridSize-1.));
    vec2 cellUV = (uv-gridPos*(1. - 1./gridSize))*(gridSize);

    if(gridSize.x <= 1){gridPos.x = 0.; cellUV.x = uv.x;}
    if(gridSize.y <= 1){gridPos.y = 0.; cellUV.y = uv.y;}

    float gridRatio = gridSize.y/gridSize.x;

    vec2 borderEpsilon = 0.003.rr * 0.5;

    borderEpsilon.y *= gridRatio;
    borderEpsilon *= 2.;
    // borderEpsilon *= max(gridSize.x, gridSize.y);

    float fga = min(
        min(
            smoothstep(1.-borderEpsilon.x, 1.-1.5*borderEpsilon.x, cellUV.x),
            smoothstep(borderEpsilon.x, 1.5*borderEpsilon.x, cellUV.x)
        ),

        min(
            smoothstep(1.-borderEpsilon.y, 1.-1.5*borderEpsilon.y, cellUV.y),
            smoothstep(borderEpsilon.y, 1.5*borderEpsilon.y, cellUV.y)
        )
    );
    
    borderEpsilon *= 2.0;
    float border = 1.- min(
        min(
            smoothstep(1.-borderEpsilon.x, 1.-1.5*borderEpsilon.x, cellUV.x),
            smoothstep(borderEpsilon.x, 1.5*borderEpsilon.x, cellUV.x)
        ),

        min(
            smoothstep(1.-borderEpsilon.y, 1.-1.5*borderEpsilon.y, cellUV.y),
            smoothstep(borderEpsilon.y, 1.5*borderEpsilon.y, cellUV.y)
        )
    );

    vec2 cellUVAR = cellUV;
    CorrectUV(cellUVAR, scale);

    const int it = 4;
    float itnb = it*it;
    vec3 color = vec3(0);

    float alpha = baseAlpha;

    float lambda = baseVariance;


    // #define USED_MIXMAX FS24_4
    // #define USED_MIXMAX FS24_12
    // #define USED_MIXMAX MixMaxNaive_Flat
    // #define USED_MIXMAX MixMaxMicro_Flat
    #define USED_MIXMAX _MixMax_choicef
    // _MixMax_choice = uv.x < .5 ? 1 : 3;
    _MixMax_choice = method;
    if(method == -1) _MixMax_choice = int(round(gridPos.x*(gridSize.x-1)));
    if(method == -2) _MixMax_choice = int(round(gridPos.y*(gridSize.y-1)));

    // if(distance(uv.y, .5) < .005) discard;
    // if(distance(uv.x, .5) < .005) discard;
    // if(distance(uv.x, 0.5) < 0.0005) {fragColor = vec4(0, 1, 0, 1); return;}

    // #define USE_FS24_FILTRERED_LEVEL_APPROXIMATION
    float FS24_LA_MULT = 1.0;

    bool inversingPriority1 = invertPriority.x == 1;
    bool inversingPriority2 = invertPriority.y == 1;
    bool inversingValue1 = invertEntry.x == 1;
    bool inversingValue2 = invertEntry.y == 1;

    bool USING_FLAT_PRIORITY = true;

    bool usePriorityDerivative = false;
    
    // #define INPUT1 ground
    // #define INPUT2 pavingStones

    // #define INPUT1 LRP1
    // #define INPUT2 LRP2


    bool doPlaneRT = false;

    switch(view)
    {
        case -2 : doPlaneRT = gridPos.y > 0.; break;
        case -1 : doPlaneRT = gridPos.x > 0.; break;
        case  1 : doPlaneRT = true; break;
    }

    int i = 0;
    int j = 0;
    float mean = 0.;
    float variance = 0.;
    float mean2 = 0.;
    float variance2 = 0.;
    bool doGroundTruthh = uv.x < .5;
    doGroundTruthh = false;

    #define TEXTURE(t, uv) vec4(doGroundTruthh ? textureLod(t, uv, 0) : texture(t, uv))
    
    #define OUTPUT_BLENDING_COLOR   0
    #define OUTPUT_INFLUENCE_GREY   1
    #define OUTPUT_FILTRAGE         2

    #define OUTPUT_BLENDING_GREY    3
    #define OUTPUT_INFLUENCE_COLOR  4
    #define OUTPUT_VARIANCE_1       5
    #define OUTPUT_VARIANCE_2       6
    #define OUTPUT_VARIANCE         7
    #define OUTPUT_FILTRAGE_1       8
    #define OUTPUT_FILTRAGE_2       9
    int fragOutput = matoutput;

    if(matoutput == -1) fragOutput = int(round(gridPos.x*(gridSize.x-1)));
    if(matoutput == -2) fragOutput = int(round(gridPos.y*(gridSize.y-1)));

    int varianceMethodLocal = varianceMethod;
    if(varianceMethod == -1) varianceMethodLocal = int(round(gridPos.x*(gridSize.x-1)));
    if(varianceMethod == -2) varianceMethodLocal = int(round(gridPos.y*(gridSize.y-1)));
    bool USE_FS24_FILTRERED_LEVEL_APPROXIMATION = varianceMethodLocal == 1;
    bool doVarianceCalculation = varianceMethodLocal != 0;

    if(varianceMethodLocal == 0 && fragOutput == OUTPUT_FILTRAGE)
    {
        doGroundTruthh = true;
        fragOutput = OUTPUT_VARIANCE;
    }
    if(varianceMethodLocal == 0 && fragOutput != OUTPUT_FILTRAGE)
    {
        doGroundTruthh = true;
    }

    // vec3 color1 = vec3(1, 1, 0);
    // vec3 color2 = vec3(1, 0, 1);

    bool doGridBorders = true;



    switch(gridAlphaMode)
    {
        case -2 : alpha = 1.-cellUV.y; break;
        case -1 : alpha = 1.-cellUV.x; break;
        case +1 : alpha = gridPos.x; break;
        case +2 : alpha = gridPos.y; break;
        default : break;
    }

    if(baseVariance < 0.)
        switch(gridVarianceMode)
        {
            case -2 : lambda = 1.-cellUV.y; break;
            case -1 : lambda = 1.-cellUV.x; break;
            case +1 : lambda = gridPos.x; break;
            case +2 : lambda = gridPos.y; break;
            default : break;
        }

    // switch(priorityMethod)
    // {
    //     case -2 : lambda = 1.-cellUV.y; break;
    //     case -1 : lambda = 1.-cellUV.x; break;
    //     case +1 : lambda = gridPos.x; break;
    //     case +2 : lambda = gridPos.y; break;
    //     default : break;
    // }

    USING_FLAT_PRIORITY = priorityMethod == 1 || (priorityMethod == -1 && gridPos.x != 0.) || (priorityMethod == -2 && gridPos.y != 0.);

    alpha += uv.x*1e-3;


/***
    [1] ###### Defining Parameters ########################### 
***/
    {
        // if(gridPos.x == 0)
        // {
        //     doVarianceCalculation = false;
        //     _MixMax_choice = 1;
        // }
        // if(gridPos.x == 1)
        // {
        //     doGroundTruthh = true;
        //     it = 1;
        //     _MixMax_choice = 1;
        // }

        // if(gridPos.x == 0)
        // {
        //     _MixMax_choice = 1;
        // }
        // if(gridPos.x == 1)
        // {
        //     _MixMax_choice = 2;
        // }

        // if(gridPos.x == 0)
        // {
        //     doGroundTruthh = true;
        //     if(gridPos.y == 1)
        //         fragOutput = OUTPUT_VARIANCE;
        // }

        // if(gridPos.x == 0.5)
        // {
        //     // usePriorityDerivative = true;
        //     // fragOutput = OUTPUT_FILTRAGE_1;
        // }

        // if(gridPos.x == 1)
        // {
        //     usePriorityDerivative = true;
        //     // fragOutput = OUTPUT_FILTRAGE_1;
        // }

        // if(grid)
        // fragOutput = OUTPUT_BLENDING_COLOR;
    }

    /// NON BINARY RESULT WITH FS24 COMPARAISON
    // {
    //     #define INPUT1 ground
    //     #define INPUT2 pavingStones

    //     alpha = cellUV.x;
    //     alpha = 0.25;

    //     lambda = 0.01;

    //     cellUVAR /= 15.0;

    //     fragOutput = OUTPUT_INFLUENCE_GREY;
    //     _MixMax_choice = 3;

    //     USE_FS24_FILTRERED_LEVEL_APPROXIMATION = gridPos.y == 0.;

    //     if(gridPos.y >= 1.)
    //     {
    //         lambda += 0.15;
    //     }
    // }



    //// ANISOTROPIC FINAL RESULTS
    {
        // #define INPUT1 ground
        // #define INPUT2 pavingStones

        // doPlaneRT = true;
        // border = 0.;

        // _MixMax_choice = 3;
        // alpha = 0.5 + cellUV.y*1e-3;

        // fragOutput = OUTPUT_INFLUENCE_GREY;

        // it = 8;

        // int gpx = int(round(gridPos.x*(gridSize.x - 1)));

        // switch(gpx)
        // {
        //     case 0 : 
        //     _MixMax_choice = 1;
        //     USE_FS24_FILTRERED_LEVEL_APPROXIMATION = true;
        //     break;

        //     case 1 : 
        //     _MixMax_choice = 3;
        //     break;

        //     case 2 : 
        //     doGroundTruthh = true; 
        //     break;
        // }
    }

    //// FILTERING FINAL RESULT 
    {
        #define INPUT1 ground
        #define INPUT2 rock
    //     fragOutput = OUTPUT_INFLUENCE_GREY;
    //     if(gridPos.x < .5) fragOutput = OUTPUT_BLENDING_COLOR;
    //     lambda = 0.01;
    //     doGridBorders = false;
    //     alpha = 0.5 + 1e-3*uv.x;

    //     // lambda = cellUVAR.y;

    //     _MixMax_choice = 1;
    //     USE_FS24_FILTRERED_LEVEL_APPROXIMATION = true;

    //     // _MixMax_choice = 3;

    //     // _MixMax_choice = 2;
    }

    {
        // #define INPUT1 ground
        // #define INPUT2 rock

        // alpha = 1.-cellUV.x;
        // lambda = gridPos.y;
        // fragOutput = OUTPUT_BLENDING_COLOR;
        // _MixMax_choice = 3;
    }

    {
        // #define INPUT1 LRP2
        // #define INPUT2 LRP1

        // // #define INPUT1 ground
        // // #define INPUT2 rock

        // alpha = cellUV.y;
        // alpha = 0.5 + cellUV.x*1e-3;
        // alpha = cos(_iTime)*.5 + .5;
        // alpha = 0.25;

        // lambda = 1.0;
        // lambda = (cos(_iTime)*.5 + .5)*1.0;
        // lambda = 0.01;
        // doPlaneRT = true;

        // color1 = vec3(1, 0, 0);
        // color2 = vec3(0, 1, 0);

        // doGridBorders = false;
        
        // _MixMax_choice = gridPos.y == 0. ? 3 : 1;
        // _MixMax_choice = 3;
        // fragOutput = OUTPUT_FILTRAGE_1;

        // int gpx = int(round(gridPos.x*(gridSize.x - 1)));

        // // switch(gpx)
        // // {
        // //     case 0 : 
        // //         doGroundTruthh = true;
        // //         fragOutput = OUTPUT_VARIANCE_1;
        // //         it = 4;
        // //     break;

        // //     case 1 : 
        // //         USE_FS24_FILTRERED_LEVEL_APPROXIMATION = true;
        // //         FS24_LA_MULT = 8.0;
        // //     break;

        // //     case 2 : 
        // //         // lambda += 0.075;
        // //         usePriorityDerivative = true;
        // //     break;

        // //     case 3 :
            
        // //     break;
        // // }
    
        // fragOutput = OUTPUT_INFLUENCE_GREY;
        // // fragOutput = OUTPUT_BLENDING_COLOR;
        // // fragOutput = OUTPUT_INFLUENCE_COLOR;
    }

/***
    [2] ###### Starting the final view setups ########################### 
***/

    float lambda1 = lambda;
    float lambda2 = lambda;
    // it *= 2;
    itnb = doGroundTruthh ? 2.0*it*it : it*it;

    if(!doGridBorders || (gridSize.x <= 1 && gridSize.y <= 1)){fga = 1.; border = 0.;}

    int k = doGroundTruthh ? 0 : 1;
    for(; k < 2; k++)
    for(i = 0; i < it; i+= doGroundTruthh ? 1 : it, j = 0)
    for(j = 0; j < it; j+= doGroundTruthh ? 1 : it)
    {

    UV_PREPROCESS

    const vec2 pixelSize = 4.*vec2(2., 1.)/vec2(_iResolution);
    vec2 off = pixelSize * (vec2(i, j)/float(it) - .5);
    // off *= 2000.*(k == 0 ? dFdx(auv) : dFdx(auv));
    // if(!doGroundTruthh) off = vec2(0);


    if(doPlaneRT)
    {

        float h = 5.0;
        vec2 uv2 = vec2(cellUV.x, cellUV.y/0.5);

        // uv2.x += _iTime*0.25;

        if(distance(uv2.y, .5) < 1e-3) uv2.y = 0.49;


        vec3 rayPos = vec3(uv2*2. - 1. + vec2(0, h) + off, 0);

        float fov = 1./radians(50.);
        vec3 rayDir = normalize(rayPos - vec3(0, h, fov));

        // if(rayDir.y <= 0.0001){fragColor.rgb = vec3(0);continue;}
        if(rayDir.y <= 0.){border = 1.;}

        float t = dot(vec3(0, h, fov), vec3(0, 1, 0))/dot(rayDir, vec3(0, 1, 0));
        auv = (rayPos - rayDir*t).rb*xrange.y;
    }
    else
    {
        auv = xrange.y*(0.25*off + cellUVAR/gridSize);
    }

    auv *= 0.25;
    // auv *= 0.5;

/***
    [3] ###### Defining Inputs ########################### 
***/

    ProceduralProcess voronoi;
    ProceduralProcess voronoi2;
    ProceduralProcess LRP1;
    ProceduralProcess LRP2;

    ProceduralProcess pavingStones;
    ProceduralProcess ground;
    ProceduralProcess rock;

    voronoi.uv = auv*15.*5.;
    LRP1.uv = auv*10;
    // LRP1.uv = auv * pow(xrange.y, 5.0);
    LRP2.uv = 1e2-LRP1.uv;

    vec3 tmpvorcenter;
    voronoi.value = 1. - clamp(voronoi3d(vec3(voronoi.uv, 0.), tmpvorcenter).r*.95 - 0.025, 0., 1.);
    voronoi.isTexture = false;
    // voronoi.histogram = float[](0.000139302, 0.000193565, 0.000251067, 0.000335566, 0.000440312, 0.000574755, 0.000756711, 0.000977272, 0.00126047, 0.00160899, 0.00204201, 0.0025482, 0.0031513, 0.00389829, 0.00475867, 0.0057678, 0.00690732, 0.00822879, 0.00970712, 0.0114292, 0.0133576, 0.0155106, 0.0180069, 0.0208262, 0.023826, 0.027162, 0.0308494, 0.0348694, 0.0392542, 0.0440788, 0.0492515, 0.0550658, 0.0611735, 0.0677061, 0.0747076, 0.0821692, 0.0900902, 0.0984756, 0.107425, 0.117075, 0.126953, 0.137335, 0.148293, 0.159667, 0.171575, 0.183893, 0.196745, 0.210379, 0.224014, 0.238113, 0.252513, 0.26719, 0.282346, 0.297832, 0.313493, 0.330032, 0.3464, 0.363021, 0.379851, 0.396772, 0.413762, 0.430832, 0.448128, 0.465943, 0.483175, 0.500346, 0.517608, 0.534796, 0.551962, 0.568858, 0.585696, 0.602807, 0.619169, 0.6354, 0.651422, 0.667123, 0.682521, 0.69764, 0.712445, 0.727364, 0.741442, 0.755259, 0.768561, 0.781637, 0.794235, 0.806393, 0.818166, 0.829907, 0.840923, 0.851416, 0.861544, 0.871237, 0.880553, 0.88937, 0.897737, 0.906042, 0.913676, 0.920899, 0.92781, 0.934175, 0.940214, 0.945849, 0.951152, 0.956294, 0.960842, 0.965156, 0.969085, 0.972722, 0.976067, 0.979054, 0.981806, 0.984375, 0.986576, 0.988565, 0.990356, 0.991902, 0.993267, 0.99446, 0.995476, 0.996331, 0.996996, 0.997554, 0.997998, 0.998351, 0.998592, 0.998754, 0.998869, 0.998959);
    voronoi.histogram = float[](0.000492877, 0.00223353, 0.00539632, 0.00964422, 0.0162912, 0.0266631, 0.042628, 0.065616, 0.0950814, 0.131675, 0.174465, 0.223817, 0.277848, 0.338428, 0.404077, 0.473382, 0.542634, 0.609411, 0.672527, 0.731532, 0.784293, 0.831614, 0.871649, 0.905405, 0.933332, 0.955506, 0.971878, 0.983132, 0.990386, 0.994973, 0.997287, 0.998024);


    voronoi2 = voronoi;
    voronoi2.uv /= 2.;
    voronoi2.value = 1. - clamp(voronoi3d(vec3(voronoi2.uv, 0.), tmpvorcenter).r*.95 - 0.025, 0., 1.);

    float timec = _iTime;
    timec = 1.;
    vec2  F = 0.5*vec2( 0.1, 0.1+ (0.5+0.5*cos(2.*.5*timec)));
    vec2  O = 0.5*vec2( 0.1, 0.1+ (0.5+0.5*sin(2.*.2*timec))*PI*2.);
    LRP1.value = doGroundTruthh ? 
        local_random_phase_noise(LRP1.uv,5.,15,F, O)*.5 + .5
        :
        filtered_local_random_phase_noise(LRP1.uv,5.,15,F, O)*.5 + .5;
        ;

    vec2  F2 = 0.5*vec2( 0.1, 0.1- (0.5+0.5*cos(2.*-.4*timec)));
    vec2  O2 = 0.5*vec2( 0.1, 0.1+ (0.5+0.5*sin(2.*.3*timec))*PI*2.);
    LRP2.value = doGroundTruthh ? 
        local_random_phase_noise(LRP2.uv,5.,15,F2, O2)*.5 + .5
        :
        filtered_local_random_phase_noise(LRP2.uv,5.,15,F2, O2)*.5 + .5;
        ;
    // LRP1.histogram = float[](0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.34982e-06, 4.85936e-06, 7.82898e-06, 1.24184e-05, 1.99774e-05, 3.61753e-05, 5.72325e-05, 7.80198e-05, 0.000113385, 0.000158469, 0.000223801, 0.000323958, 0.000449491, 0.000620649, 0.000861457, 0.00116112, 0.00152854, 0.00196885, 0.00255738, 0.00331328, 0.00436911, 0.00570462, 0.00739217, 0.00960534, 0.0123436, 0.0158515, 0.0201026, 0.0253702, 0.0317392, 0.0393209, 0.0481082, 0.0588045, 0.071288, 0.0858056, 0.102514, 0.121674, 0.14324, 0.16714, 0.19331, 0.223182, 0.254489, 0.288094, 0.323938, 0.36122, 0.400087, 0.439822, 0.480222, 0.521994, 0.562052, 0.601841, 0.640445, 0.677406, 0.712684, 0.745869, 0.776913, 0.806523, 0.832818, 0.856517, 0.877665, 0.896534, 0.91311, 0.927596, 0.940144, 0.951221, 0.960282, 0.967818, 0.974099, 0.979253, 0.983425, 0.986752, 0.989469, 0.991671, 0.993323, 0.994693, 0.99577, 0.9966, 0.997186, 0.997619, 0.997937, 0.998195, 0.998394, 0.998545, 0.998658, 0.998747, 0.998817, 0.998866, 0.998898, 0.998924, 0.99894, 0.998953, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959);
    LRP1.histogram = float[](0, 0, 0, 0, 8.76659e-06, 0.000129551, 0.000544503, 0.00204749, 0.00516937, 0.0127427, 0.0302311, 0.0644198, 0.124403, 0.219876, 0.349938, 0.507996, 0.664306, 0.795882, 0.886575, 0.943815, 0.975755, 0.989646, 0.99527, 0.996983, 0.997789, 0.997988, 0.998024, 0.998024, 0.998024, 0.998024, 0.998024, 0.998024);
    LRP2.histogram = LRP1.histogram;
    LRP1.isTexture = LRP2.isTexture = false;

    pavingStones.isTexture = true;
    pavingStones.uv = auv;
    pavingStones.color   = TEXTURE(bTextures[0], pavingStones.uv).rgb;
    pavingStones.value   = rgb2hsv(TEXTURE(bTextures[0], pavingStones.uv).rgb).b;
    pavingStones.priority        = TEXTURE(bTextures[1], pavingStones.uv).r;
    pavingStones.prioritySquared = TEXTURE(bTextures[2], pavingStones.uv).r;

    ground.isTexture = true;
    ground.uv = auv;
    ground.color   = TEXTURE(bTextures[3], ground.uv).rgb;
    ground.value   = rgb2hsv(TEXTURE(bTextures[3], ground.uv).rgb).b;
    ground.priority        = TEXTURE(bTextures[4], ground.uv).r;
    ground.prioritySquared = TEXTURE(bTextures[5], ground.uv).r;

    rock.isTexture = true;
    rock.uv = auv;
    rock.color   = TEXTURE(bTextures[6], rock.uv).rgb;
    rock.value   = rgb2hsv(TEXTURE(bTextures[6], rock.uv).rgb).b;
    rock.priority        = TEXTURE(bTextures[7], rock.uv).r;
    rock.prioritySquared = TEXTURE(bTextures[8], rock.uv).r;

    ProceduralProcess ins[] = {voronoi, voronoi2, LRP1, LRP2, rock, pavingStones, ground};

    ProceduralProcess co1 = ins[entry1];
    ProceduralProcess co2 = ins[entry2];

    ProceduralProcess in1 = ins[priority1];
    ProceduralProcess in2 = ins[priority2];


    // ProceduralProcess co1 = INPUT1;
    // ProceduralProcess co2 = INPUT2;
    // ProceduralProcess in1 = INPUT1;
    // ProceduralProcess in2 = INPUT2;

    // switch(entry1)
    // {
    //     case 0 : in1 = pavingStones; break;
    // }

    // if(entry1 == 0) in1 = pavingStones;
    // if(uv.x < -1.) in1 = pavingStones;

/***
    [4] ###### Calculating MIX ########################### 
***/
    float p1, p2;

    if(USING_FLAT_PRIORITY)
    {
        p1 = in1.isTexture ? in1.priority : ProceduralPriority_HIST_SIZE(in1);
        p2 = in2.isTexture ? in2.priority : ProceduralPriority_HIST_SIZE(in2);
    }
    else
    {
        p1 = in1.value;
        p2 = in2.value;
    }

    if(doVarianceCalculation)
    {
        // in1.filtered = derivative(in1.uv*512.)/8.; // Meilleurs résultats pour ground et pavingstones avec MixMaxMicro_Flat
        // in2.filtered = derivative(in2.uv*512.)/8.; // Meilleurs résultats pour ground et pavingstones avec MixMaxMicro_Flat

        // in1.filtered = derivative(in1.uv*1024.)/8.; // Meilleurs résultats pour ground et pavingstones avec MixMaxMicro_Flat
        // in2.filtered = derivative(in2.uv*1024.)/8.; // Meilleurs résultats pour ground et pavingstones avec MixMaxMicro_Flat

        in1.filtered = derivative(in1.uv*64)/64.; // Meilleurs résultats pour ground et pavingstones avec MixMaxMicro_Flat
        in2.filtered = derivative(in2.uv*64)/64.; // Meilleurs résultats pour ground et pavingstones avec MixMaxMicro_Flat

        // in1.filtered = derivative(in1.uv*64.)/'64.; // Meilleurs résultats pour ground et pavingstones avec MixMaxMicro_Flat
        // in2.filtered = derivative(in2.uv*64.)/64.; // Meilleurs résultats pour ground et pavingstones avec MixMaxMicro_Flat


        // if(in1.filtered > 1) discard;

        // float duv = derivative(in1.uv*1024.)/8.0; 
        if(usePriorityDerivative)
        {
            float dpr1 = derivativeLinear(1.-p1)/2.;
            float duv1 = in1.filtered;
            in1.filtered = mix(dpr1*dpr1, 1.0, duv1);

            float dpr2 = derivativeLinear(1.-p2)/2.;
            float duv2 = in2.filtered;
            in2.filtered = mix(dpr2*dpr2, 1.0, duv2);
        }

        if(USE_FS24_FILTRERED_LEVEL_APPROXIMATION)
        {
            if(in1.isTexture) in1.filtered = FS24_LA_MULT*abs(in1.prioritySquared - in1.priority*in1.priority);
            if(in2.isTexture) in2.filtered = FS24_LA_MULT*abs(in2.prioritySquared - in2.priority*in2.priority);
        }

        // filtrage = doGroundTruthh ? 0. : sqrt(in1.filtered*in1.filtered + in2.filtered*in2.filtered);
        filtrage = doGroundTruthh ? 0. : in1.filtered + in2.filtered;
    }

    vec2 mixmax = USED_MIXMAX(
        in1.value, inversingPriority1 ? 1. - p1 : p1, lambda1,
        in2.value, inversingPriority2 ? 1. - p2 : p2, lambda2,
        alpha
    );
    
    // in1.value *= inversingValue1 ? -1. : 1.;
    // in2.value *= inversingValue2 ? -1. : 1.;
    co1.value = inversingValue1 ? 1.-co1.value : co1.value;
    co2.value = inversingValue2 ? 1.-co2.value : co2.value;

/***
    [5] ###### Output ########################### 
***/
    switch(fragOutput)
    {
        case OUTPUT_BLENDING_COLOR : 
            if(!co1.isTexture) co1.color = co1.value*color1;
            if(!co2.isTexture) co2.color = co2.value*color2;
            fragColor.rgb = mix(co1.color, co2.color, mixmax.r);

            // fragColor.rgb = preservingMix(co1.color, color1*0.5.rrr, co2.color, color2*0.5.rrr, 1.-mixmax.r);
            // fragColor.rgb = mix(p1, p2, mixmax.r).rrr;
        break;

        case OUTPUT_BLENDING_GREY : 
            fragColor.rgb = mix(co1.value, co2.value, mixmax.r).rrr;
        break;

        case OUTPUT_INFLUENCE_GREY : 
            fragColor.rgb = 1. - mixmax.rrr;
        break;  

        case OUTPUT_INFLUENCE_COLOR : 
            fragColor.rgb = mix(color1, color2, mixmax.r);
        break; 

        case OUTPUT_FILTRAGE : 
            fragColor.rgb = sqrt(filtrage.rrr);
        break; 

        case OUTPUT_FILTRAGE_1 : 
            fragColor.rgb = 2. * sqrt(in1.filtered).rrr;
        break; 

        case OUTPUT_FILTRAGE_2 : 
            fragColor.rgb = 2. * sqrt(in2.filtered).rrr;
        break; 

        case OUTPUT_VARIANCE :
            if(k == 0)
            {
                mean += 2.0 * p1 / itnb;
                mean2 += 2.0 * p2 / itnb;
            }
            else
            {
                variance += pow(p1-mean, 2.0);
                variance2 += pow(p2-mean2, 2.0);
            }

            fragColor.rgb = vec3(0);
            if(i == it-1 && j == it-1 && k == 1)
            {
                variance = 2.*variance/itnb;
                variance2 = 2.*variance2/itnb;
                fragColor.rgb = sqrt(variance + variance2).rrr;
                // fragColor.rgb = 2.0 * sqrt(2.0*variance.rrr/itnb);
                // fragColor.rgb = mean.rrr;
                itnb = 1;
            }
        break;

        default : break;
    }

    color += fragColor.rgb / (doGroundTruthh ? itnb : 1.);
    }

    fragColor.a = fga;
    fragColor.rgb = mix(color, vec3(0.1), border);
}