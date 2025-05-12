#include ../../data/noises/utils.glsl
#include functions/FiltrableNoises.glsl

#define HIST_SIZE 128

layout (binding = 0) uniform sampler2D bTextures[9];

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

float ProceduralPriority_HIST_SIZE(ProceduralProcess p)
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
    // p1 = 2.*p1-1.;
    // p2 = 2.*p2-1.;
    // alpha = 2.*alpha-1.;
    // alpha = alpha*2.0;

    // p2 -= alpha;
    // p1 -= alpha;

    // p1 *= -1;
    // p2 *= -1;

    p2 += 2.0*(1.-alpha);
    p1 += 2.0*(alpha);

    float CDF = .5 + .5*tanh(0.85*alpha);
    // CDF = 1.0;

    filtrage = max(filtrage, 0.);

    float s = sqrt(m1*m1+m2*m2 + filtrage);

    return vec2(
        clamp(.5 - CDF*(p1 - p2)/s, 0., 1.), 
        0.
        );

    return vec2(
        clamp(1. - CDF*((p1 + alpha)-(p2 - alpha)/sqrt(m1*m1+m2*m2)), 0., 1.), 
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
    // iCDF = d*2. * 0.125;

    // iCDF *= .125;
    // iCDF = 0.;

    /*
        filtrage ==> 0
            s ==> sqrt(m1² + m2²)
                \int mixmax ==> alpha

        filtrage ==> 1
            s ==> -d(.5-alpha+iCDF)
                mixmax ==> alpha
    */

    // alpha = max(alpha, 1e-6);

    // iCDF = mix(iCDF, 2.*iCDF, filtrage);
    float sf = -d/(.5 - alpha + iCDF);
    s = mix(s, sf, clamp(filtrage, 0., 1.));

    s = max(s, 1e-6);

    // s = sf;

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
        case 0 : return FS24_4(v1, p1, m1, v2, p2, m2, alpha);
        case 1 : return FS24_12(v1, p1, m1, v2, p2, m2, alpha);
        case 2 : return MixMaxNaive_Flat(v1, p1, m1, v2, p2, m2, alpha);
        case 3 : return MixMaxMicro_Flat(v1, p1, m1, v2, p2, m2, alpha);
        default : return vec2(0.);
    }
}

void main()
{
    int it = 8;
    float itnb = it*it*2.;
    vec3 color = vec3(0);

    float alpha = cos(_iTime*.5)*.5 + .5;
    // alpha = cos(_iTime)*.25 + .25;
    // alpha = linearstep(-5000, 5000, uv.x);
    alpha = 0.5 + uv.x*0.0001;
    // alpha = uv.x;

    float lambda = cos(_iTime)*.5 + .5;
    lambda = 0.01; 
    float lambda1 = lambda;
    float lambda2 = lambda;


    // #define USED_MIXMAX FS24_4
    // #define USED_MIXMAX FS24_12
    // #define USED_MIXMAX MixMaxNaive_Flat
    #define USED_MIXMAX MixMaxMicro_Flat
    // #define USED_MIXMAX _MixMax_choicef
    // _MixMax_choice = uv.x < .5 ? 1 : 3;
    // if(distance(uv.y, .5) < .005) discard;
    // if(distance(uv.x, .5) < .005) discard;

    // #define USE_FS24_FILTRERED_LEVEL_APPROXIMATION

    bool inversingPriority1 = false;
    bool inversingPriority2 = false;
    bool inversingValue1 = false;
    bool inversingValue2 = false;

    bool USING_FLAT_PRIORITY = true;
    
    #define INPUT1 ground
    #define INPUT2 pavingStones


    bool doPlaneRT = true;

    int i = 0;
    int j = 0;
    #define GROUND_TRUTH_IT

    #ifdef GROUND_TRUTH_IT
        #define TEXTURE(t, uv) textureLod(t, uv, 0)
    #else
        #define TEXTURE(t, uv) texture(t, uv)
    #endif

    float df = 0;
    #ifdef GROUND_TRUTH_IT
    for(; i < it; i++, j = 0)
    for(; j < it; j++)
    for(int k = 0; k < 2; k++)
    {
    #endif
/***
    [0] ###### Defining View Parameters ########################### 
***/
    UV_PREPROCESS

    // auv *= 0.1;
    // auv += 0.23;

    if(doPlaneRT)
    {
        float h = 5.0;
        vec2 uv2 = vec2(uv.x, uv.y/0.5);

        // uv2.y += 1./distance(uv2.y, .5);
        if(distance(uv2.y, .5) < 1e-3) uv2.y = 0.49;

        // float df = derivativeSum(uv2*980.0)*0.25;
        // df = 0.0;

        // #ifdef GROUND_TRUTH_IT
        // // float df_mult1 = 0.125*0.125;
        // // float df_mult2 = 350;
        // // float df_mult1 = 1;
        // // float df_mult2 = 8;
        // float df_mult1 = 8;
        // float df_mult2 = 128;
        // // df = k == 0 ? length(dFdx(auv*df_mult1)) : length(dFdy(auv*df_mult1));
        // df = derivativeLinear(auv*df_mult1)*df_mult2;

        // // df = uv.x;

        // #endif

        // vec3 rayPos = vec3(uv2*2. - 1. + vec2(0, h) + df*(vec2(i,j)/float(it) - .5), 0);
        
        if(distance(uv.x, 0.5) < 0.0005)
        {
            fragColor.rgb = vec3(0, 1, 0); return;
        }

        df = 0.001;

        vec2 off = df*(1.0 - 2.0*vec2(FiHash(vec2(0) + i*PI + j*SQR2), FiHash(vec2(0) - i*PI - j*SQR2)));
        // off = df*(1.0 - 2.0*vec2(i,j)/float(it));:
        vec3 rayPos = vec3(uv2*2. - 1. + vec2(0, h) + off, 0);
        // vec3 rayPos = vec3(uv2*2. - 1. + vec2(0, h), 0);

        // vec2 offsets[16] = vec2[](
        //     vec2(-0.375, -0.375), vec2(-0.125, -0.375), vec2(0.125, -0.375), vec2(0.375, -0.375),
        //     vec2(-0.375, -0.125), vec2(-0.125, -0.125), vec2(0.125, -0.125), vec2(0.375, -0.125),
        //     vec2(-0.375,  0.125), vec2(-0.125,  0.125), vec2(0.125,  0.125), vec2(0.375,  0.125),
        //     vec2(-0.375,  0.375), vec2(-0.125,  0.375), vec2(0.125,  0.375), vec2(0.375,  0.375)
        // );

        // vec3 rayPos = vec3(uv2*2. - 1. + vec2(0, h) - 0.01*offsets[i], 0);


        float fov = 1./radians(50.);

        vec3 rayDir = normalize(rayPos - vec3(0, h, fov));

        if(rayDir.y <= 0.0001)
        {
            fragColor.rgb = vec3(0);
            #ifdef GROUND_TRUTH_IT
                continue;
                // rayDir.y = 0.0;
            #else
                return;
            #endif
        }


        float t = dot(vec3(0, h, fov), vec3(0, 1, 0))/dot(rayDir, vec3(0, 1, 0));
        vec3 p = rayPos - rayDir*t;
        
        fragColor.rgb = rayDir*.5 + .5;
        fragColor.rgb = p.rgb;
        // fragColor.rgb = p.rrr;

        // p.xz = sign(p.xz)*min(abs(p.xz), 5000);
        auv = p.rb;

        #ifdef GROUND_TRUTH_IT
        // df = derivativeLinear(auv*8.0);

        auv.x += _iTime;

        // df = derivative(auv*1000)*0.003;

        // float df_mult1 = 1;
        // float df_mult2 = 0.025;
        // df = k == 0 ? length(dFdx(auv*df_mult1))*df_mult2 : length(dFdy(auv*df_mult1))*df_mult2;
        // df = clamp(df, 0., 0.02);


        // auv += df*(vec2(i,j)/float(it) - .5);
        // auv += df*(1.0 - 2.0*vec2(FiHash(uv + i*PI + j*SQR2 + k*SQR3), FiHash(uv.yx - i*PI - j*SQR2 - k*SQR3)));
        #endif
        
        // fragColor.rgb = vec3(0);
        // {fragColor.r = df.r; return;}


        // return;
    }


/***
    [1] ###### Defining Inputs ########################### 
***/

    ProceduralProcess voronoi;
    ProceduralProcess voronoi2;
    ProceduralProcess LRP1;
    ProceduralProcess LRP2;

    ProceduralProcess pavingStones;
    ProceduralProcess ground;
    ProceduralProcess rock;

    voronoi.uv = auv*15.;
    LRP1.uv = auv;
    // LRP1.uv = auv * pow(xrange.y, 5.0);
    LRP2.uv = 1e2-LRP1.uv;

    vec3 tmpvorcenter;
    voronoi.value = 1. - clamp(voronoi3d(vec3(voronoi.uv, 0.), tmpvorcenter).r*.95 - 0.025, 0., 1.);
    voronoi.isTexture = false;
    voronoi.histogram = float[](0.000139302, 0.000193565, 0.000251067, 0.000335566, 0.000440312, 0.000574755, 0.000756711, 0.000977272, 0.00126047, 0.00160899, 0.00204201, 0.0025482, 0.0031513, 0.00389829, 0.00475867, 0.0057678, 0.00690732, 0.00822879, 0.00970712, 0.0114292, 0.0133576, 0.0155106, 0.0180069, 0.0208262, 0.023826, 0.027162, 0.0308494, 0.0348694, 0.0392542, 0.0440788, 0.0492515, 0.0550658, 0.0611735, 0.0677061, 0.0747076, 0.0821692, 0.0900902, 0.0984756, 0.107425, 0.117075, 0.126953, 0.137335, 0.148293, 0.159667, 0.171575, 0.183893, 0.196745, 0.210379, 0.224014, 0.238113, 0.252513, 0.26719, 0.282346, 0.297832, 0.313493, 0.330032, 0.3464, 0.363021, 0.379851, 0.396772, 0.413762, 0.430832, 0.448128, 0.465943, 0.483175, 0.500346, 0.517608, 0.534796, 0.551962, 0.568858, 0.585696, 0.602807, 0.619169, 0.6354, 0.651422, 0.667123, 0.682521, 0.69764, 0.712445, 0.727364, 0.741442, 0.755259, 0.768561, 0.781637, 0.794235, 0.806393, 0.818166, 0.829907, 0.840923, 0.851416, 0.861544, 0.871237, 0.880553, 0.88937, 0.897737, 0.906042, 0.913676, 0.920899, 0.92781, 0.934175, 0.940214, 0.945849, 0.951152, 0.956294, 0.960842, 0.965156, 0.969085, 0.972722, 0.976067, 0.979054, 0.981806, 0.984375, 0.986576, 0.988565, 0.990356, 0.991902, 0.993267, 0.99446, 0.995476, 0.996331, 0.996996, 0.997554, 0.997998, 0.998351, 0.998592, 0.998754, 0.998869, 0.998959);
    
    voronoi2 = voronoi;
    voronoi2.uv /= 2.;
    voronoi2.value = 1. - clamp(voronoi3d(vec3(voronoi2.uv, 0.), tmpvorcenter).r*.95 - 0.025, 0., 1.);

    float timec = _iTime;
    timec = 1.;
    vec2  F = 0.5*vec2( 0.1, 0.1+ (0.5+0.5*cos(2.*.5*timec)));
    vec2  O = 0.5*vec2( 0.1, 0.1+ (0.5+0.5*sin(2.*.2*timec))*PI*2.);
    #ifdef GROUND_TRUTH_IT
        LRP1.value = local_random_phase_noise(LRP1.uv,5.,15,F, O)*.5 + .5;
    #else
        LRP1.value = filtered_local_random_phase_noise(LRP1.uv,5.,15,F, O)*.5 + .5;
    #endif

    vec2  F2 = 0.5*vec2( 0.1, 0.1- (0.5+0.5*cos(2.*-.4*timec)));
    vec2  O2 = 0.5*vec2( 0.1, 0.1+ (0.5+0.5*sin(2.*.3*timec))*PI*2.);
    #ifdef GROUND_TRUTH_IT
        LRP2.value = local_random_phase_noise(LRP2.uv,5.,15,F2, O2)*.5 + .5;
    #else
        LRP2.value = filtered_local_random_phase_noise(LRP2.uv,5.,15,F2, O2)*.5 + .5;
    #endif

    LRP1.histogram = float[](0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.34982e-06, 4.85936e-06, 7.82898e-06, 1.24184e-05, 1.99774e-05, 3.61753e-05, 5.72325e-05, 7.80198e-05, 0.000113385, 0.000158469, 0.000223801, 0.000323958, 0.000449491, 0.000620649, 0.000861457, 0.00116112, 0.00152854, 0.00196885, 0.00255738, 0.00331328, 0.00436911, 0.00570462, 0.00739217, 0.00960534, 0.0123436, 0.0158515, 0.0201026, 0.0253702, 0.0317392, 0.0393209, 0.0481082, 0.0588045, 0.071288, 0.0858056, 0.102514, 0.121674, 0.14324, 0.16714, 0.19331, 0.223182, 0.254489, 0.288094, 0.323938, 0.36122, 0.400087, 0.439822, 0.480222, 0.521994, 0.562052, 0.601841, 0.640445, 0.677406, 0.712684, 0.745869, 0.776913, 0.806523, 0.832818, 0.856517, 0.877665, 0.896534, 0.91311, 0.927596, 0.940144, 0.951221, 0.960282, 0.967818, 0.974099, 0.979253, 0.983425, 0.986752, 0.989469, 0.991671, 0.993323, 0.994693, 0.99577, 0.9966, 0.997186, 0.997619, 0.997937, 0.998195, 0.998394, 0.998545, 0.998658, 0.998747, 0.998817, 0.998866, 0.998898, 0.998924, 0.99894, 0.998953, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959, 0.998959);
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

/***
    [2] ###### Defining Parameters ########################### 
***/
    ProceduralProcess in1 = INPUT1;
    ProceduralProcess in2 = INPUT2;

/***
    [3] ###### Calculating MIX ########################### 
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

    // p1 = .5;
    // p2 = .5;

    // in1.filtered = 2.*derivative(in1.uv * 100)/7.5; // Excéllent résultats !
    // in2.filtered = 2.*derivative(in2.uv * 100)/7.5; // Excéllent résultats !

    // in1.filtered = derivative(in1.uv * 75)*.125*2.; // Excéllent résultats !
    // in2.filtered = derivative(in2.uv * 75)*.125*2.; // Excéllent résultats !

    // in1.filtered = derivative(in1.uv * 200)*.5; // Excéllent résultats pour LRP!
    // in2.filtered = derivative(in2.uv * 200)*.5; // Excéllent résultats pour LRP!

    // in1.filtered = derivative(in1.uv * 1024.)/48.; // Excéllent résultats pour ground et pavingstones avec FS24
    // in2.filtered = derivative(in2.uv * 1024.)/48.; // Excéllent résultats pour ground et pavingstones avec FS24
    
    // in1.filtered = derivative(in1.uv * 1024.)/16.; // Excéllent résultats pour ground et pavingstones avec MixMaxMicro_Flat
    // in2.filtered = derivative(in2.uv * 1024.)/16.; // Excéllent résultats pour ground et pavingstones avec MixMaxMicro_Flat

    
    in1.filtered = derivative(in1.uv*512.)/8.; // Meilleurs résultats pour ground et pavingstones avec MixMaxMicro_Flat
    in2.filtered = derivative(in2.uv*512.)/8.; // Meilleurs résultats pour ground et pavingstones avec MixMaxMicro_Flat


    // in1.filtered = 1.-(derivativeLinear(p1*64));
    // in2.filtered = 1.-(derivativeLinear(p2*64));

    // in1.filtered = pow(2.*(.5-distance(p1, .5)), 100.0);
    // in2.filtered = pow(2.*(.5-distance(p2, .5)), 100.0);
 
    // in1.filtered = .5-distance(p1, .5);
    // in2.filtered = .5-distance(p2, .5);
    // float tmpf = pow(in1.filtered+in2.filtered, 10.0);
    //  filtrage = 2.*clamp(tmpf, 0., 1.);

    #ifdef USE_FS24_FILTRERED_LEVEL_APPROXIMATION
    if(uv.x < .5)
    {
        if(in1.isTexture) in1.filtered = 6.*abs(in1.prioritySquared - in1.priority*in1.priority);
        if(in2.isTexture) in2.filtered = 6.*abs(in2.prioritySquared - in2.priority*in2.priority);
    }
    #endif

    // filtrage = clamp(max(in1.filtered, in2.filtered), 0., 1.);
    // filtrage = clamp((in1.filtered + in2.filtered), 0., 1.);
    filtrage = in1.filtered + in2.filtered;

    // if(_iResolution.x < 512)
        // filtrage = 0.65;
    // else
        // filtrage = 0.0;

    // fragColor.rgb = filtrage.rrr; return;

    #ifdef GROUND_TRUTH_IT
    filtrage = 0.;
    #endif

    vec2 mixmax = USED_MIXMAX(
        in1.value, inversingPriority1 ? 1. - p1 : p1, lambda1,
        in2.value, inversingPriority2 ? 1. - p2 : p2, lambda2,
        alpha
    );
    
    in1.value *= inversingValue1 ? -1. : 1.;
    in2.value *= inversingValue2 ? -1. : 1.;

/***
    [4] ###### Output ########################### 
***/
    fragColor.rgb = mix(vec3(1, 0, 0), vec3(0, 1, 0), mixmax.r);
    // fragColor.rgb = mix(vec3(1, 0, 0)*in1.value, vec3(0, 1, 0)*in2.value, mixmax.r);
    // fragColor.rgb = mix(in1.value, in2.value, mixmax.r).rrr;
    // fragColor.rgb = mix(in1.color, in2.color, mixmax.r);
    fragColor.rgb = 1.-mixmax.rrr;
    // if(uv.y > .5)fragColor.rgb = uv.xxx;

    // fragColor.rg = vec2(0);
    // fragColor.b = filtrage;

    // fragColor.rgb = in1.value.rrr;
    // fragColor.rgb = abs(p1.rrr - p2.rrr);

    #ifdef GROUND_TRUTH_IT
    color += fragColor.rgb / itnb;
    }

    // if(uv.y < 0.252){fragColor.rgb = vec3(0); return;}

    fragColor.rgb = color;
    #endif

    
    // fragColor = TEXTURE(bTextures[0], auv);
    // fragColor.rgb = float(TEXTUREQueryLevels(bTextures[0])).rrr/13.;
    // fragColor = TEXTURELod(bTextures[0], auv, float(TEXTUREQueryLevels(bTextures[0])));
    // fragColor = TEXTURELod(bTextures[0], auv/5.0, cos(_iTime)*5.0);
}