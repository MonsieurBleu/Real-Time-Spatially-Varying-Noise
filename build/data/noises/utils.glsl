

void CorrectUV(in out vec2 auv, vec2 scale)
{    
    vec2 ascale = scale;
    ascale.y /= float(_iResolution.x)/float(_iResolution.y);

    if(ascale.x > ascale.y)
    {
        auv.x *= ascale.x/ascale.y;
        auv.x -= 0.5 * (scale.x/scale.y) * (float(_iResolution.x)/float(_iResolution.y));
        auv.x += 0.5;
        auv *= float(_iResolution.y)/1000;
    }
    else
    {
        auv.y /= ascale.x/ascale.y;
        auv.y += 0.5;
        auv.y -= 0.5 * (scale.y/scale.x) * (float(_iResolution.y)/float(_iResolution.x));
        auv *= float(_iResolution.x)/1000;
    }
}
