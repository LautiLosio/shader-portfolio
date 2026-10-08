// Port of reference/android-original.frag. State now lives on the CPU.
export const vertexShader = `
attribute vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;
export const fragmentShader = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform vec2 touch;
uniform vec2 uDrag;
uniform float startRandom;
uniform float uWorldSize;
uniform float uElapsed;
uniform float uGridSize;
uniform float uDesktop;
uniform float uPulse;
uniform vec2 uPulseCenter;
/* ============================================================
   ART CONTROLS: TOUCH
   ============================================================ */

// Radio efectivo, como fracción del ancho de pantalla.
#define TOUCH_AREA            0.25

// Movimiento de las tres capas juntas.
#define FABRIC_PULL           0.5

// Separación máxima del rojo y el azul, en celdas.
#define RGB_SPLIT_CELLS       5.0

// Separación del verde respecto de las otras capas.
// 0.0 lo deja en el centro; 1.0 restaura la separación igual.
#define GREEN_SPLIT           1.0

// 0°: rojo arriba, verde abajo a la izquierda,
// azul abajo a la derecha. Positivo gira en sentido horario.
#define SPLIT_ROTATION_DEG    0.0

// Color durante la interacción. En reposo conserva el gris original.
// Bajar G reduce el verde; bajar B hace la mezcla más cálida.
#define TOUCH_TINT            vec3(1.0, 1.0, 1.0)

// Tiempo de respuesta y regreso, en segundos.
#define FOLLOW_TIME           0.030
#define RETURN_TIME           0.43


/* ============================================================
   FIXED LOOK
   ============================================================ */

#define DOT_COLOR             vec3(0.45, 0.45, 0.45)
#define BG_COLOR              vec3(0.0, 0.0, 0.0)

#define GRID_SIZE             uGridSize
#define MAX_DOT_RADIUS        0.5
#define MIN_DOT_RADIUS        0.0
#define DOT_SOFTNESS          0.1

#define NOISE_SCALE           2.0
#define DETAIL_SCALE          3.0
#define DETAIL_AMOUNT         0.2
#define WARP_AMOUNT           0.85
#define WARP_SCALE            1.2
#define RANDOM_OFFSET         100.0

#define SPEED                 0.40
#define WIND_X                0.33
#define WIND_Y               -0.33
#define FLOW_AMOUNT           0.28
#define FLOW_SPEED            0.12
#define START_FADE_FRAMES     120.0

#define THRESHOLD             0.2
#define THRESHOLD_SOFT        0.7
#define FIELD_POWER           1.45
#define SIZE_GAIN             1.0

#define RELEASE_EPSILON       0.012


/* ============================================================
   NOISE
   ============================================================ */

float hash21(vec2 p)
{
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);

    return fract(p.x * p.y);
}


float noise2D(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 u =
        f * f * f *
        (f * (f * 6.0 - 15.0) + 10.0);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    return mix(
        mix(a, b, u.x),
        mix(c, d, u.x),
        u.y
    );
}


/* ============================================================
   FLOW
   ============================================================ */

float organicNoise(vec2 p, float t)
{
    vec2 warp;

    warp.x =
        noise2D(
            p * WARP_SCALE +
            vec2(
                t * FLOW_SPEED,
                -t * FLOW_SPEED * 0.37
            )
        );

    warp.y =
        noise2D(
            p * WARP_SCALE +
            vec2(8.17, 3.41) +
            vec2(
                -t * FLOW_SPEED * 0.21,
                 t * FLOW_SPEED
            )
        );

    warp = warp * 2.0 - 1.0;

    vec2 q =
        p +
        warp * WARP_AMOUNT;

    q += vec2(WIND_X, WIND_Y) * t;

    float n1 =
        noise2D(q);

    float n2 =
        noise2D(
            q * DETAIL_SCALE +
            vec2(
                t * FLOW_AMOUNT,
                -t * FLOW_AMOUNT * 0.43
            )
        );

    return clamp(
        mix(n1, n2, DETAIL_AMOUNT),
        0.0,
        1.0
    );
}


/* ============================================================
   DOTS
   ============================================================ */

float getDotRadius(
    vec2 cellID,
    float aspect,
    float t,
    vec2 seedOffset
)
{
    vec2 noiseUV =
        (cellID + 0.5) / GRID_SIZE;

    // Square world coordinates, independent of viewport aspect ratio.
    noiseUV *= NOISE_SCALE;
    noiseUV += seedOffset;

    float field =
        organicNoise(noiseUV, t);

    float intensity =
        smoothstep(
            THRESHOLD,
            THRESHOLD + THRESHOLD_SOFT,
            field
        );

    intensity =
        pow(intensity, FIELD_POWER);

    intensity =
        clamp(
            intensity * SIZE_GAIN,
            0.0,
            1.0
        );

    float radius =
        mix(
            MIN_DOT_RADIUS,
            MAX_DOT_RADIUS,
            intensity
        );

    float visibility =
        smoothstep(
            THRESHOLD - 0.04,
            THRESHOLD + 0.02,
            field
        );

    return radius * visibility;
}


float renderDots(
    vec2 pixelPosition,
    float cellSize,
    float aspect,
    float t,
    vec2 seedOffset
)
{
    vec2 gridCoord =
        pixelPosition / cellSize;

    vec2 cellID =
        floor(gridCoord);

    vec2 local =
        fract(gridCoord) - 0.5;

    float radius =
        getDotRadius(
            cellID,
            aspect,
            t,
            seedOffset
        );

    float d =
        length(local);

    // Clicks and taps shrink dots locally, then restore their original size.
    vec2 pulseDelta = (gl_FragCoord.xy - uPulseCenter) / (TOUCH_AREA * uWorldSize);
    float pulseDistance = dot(pulseDelta, pulseDelta);
    float shrink = uPulse * exp(-2.0 * pulseDistance) *
        (1.0 - smoothstep(1.5, 2.25, pulseDistance));
    float sizeScale = 1.0 - 0.25 * shrink;
    radius *= sizeScale;

    return
        1.0 -
        smoothstep(
            radius - DOT_SOFTNESS * sizeScale,
            radius + DOT_SOFTNESS * sizeScale,
            d
        );
}


void main()
{
    vec2 frag =
        gl_FragCoord.xy;

    float aspect =
        1.0;

    float t =
        time * SPEED;

    float cellSize =
        uWorldSize / GRID_SIZE;

    vec2 seedOffset =
        vec2(
            startRandom * RANDOM_OFFSET,
            startRandom * RANDOM_OFFSET * 1.731
        );


    vec2 drag = uDrag;

    /* SINGLE LAYER WHEN IDLE */

    float fade = smoothstep(0.0, 2.0, uElapsed);

    if (drag.x == 0.0 && drag.y == 0.0 && uPulse == 0.0)
    {
        float dotLayer =
            renderDots(
                frag,
                cellSize,
                aspect,
                t,
                seedOffset
            );

        gl_FragColor =
            vec4(
                BG_COLOR +
                dotLayer *
                (DOT_COLOR - BG_COLOR) *
                fade,
                1.0
            );

        return;
    }


    /* TOUCH AREA */

    vec2 fromTouch =
        (frag - touch) /
        (TOUCH_AREA * uWorldSize);

    float distanceSquared =
        dot(fromTouch, fromTouch);

    vec2 fromPulse = (frag - uPulseCenter) / (TOUCH_AREA * uWorldSize);
    float pulseDistanceSquared = dot(fromPulse, fromPulse);
    float pulseFalloff = exp(-2.0 * pulseDistanceSquared) *
        (1.0 - smoothstep(1.5, 2.25, pulseDistanceSquared));
    float pulseStrength = uPulse * pulseFalloff;

    // Fuera del área de interacción solo se calcula una capa.
    if (distanceSquared >= 2.25 && (uPulse == 0.0 || pulseDistanceSquared >= 2.25))
    {
        float dotLayer =
            renderDots(
                frag,
                cellSize,
                aspect,
                t,
                seedOffset
            );

        gl_FragColor =
            vec4(
                BG_COLOR +
                dotLayer *
                (DOT_COLOR - BG_COLOR) *
                fade,
                1.0
            );

        return;
    }

    // Caída continua con pendiente cero al llegar al borde.
    // Evita que desplazamientos diminutos sigan formando anillos
    // visibles lejos del dedo.
    float fabric =
        1.0 -
        smoothstep(
            0.04,
            2.25,
            distanceSquared
        );

    fabric *= fabric;

    // Desktop has a broad, gradual tail, with no flat center or visible rim.
    float cursorFalloff = exp(-2.0 * distanceSquared) *
        (1.0 - smoothstep(1.5, 2.25, distanceSquared));
    fabric = mix(fabric, cursorFalloff, uDesktop);

    vec2 fabricDisplacement =
        drag *
        (mix(max(FABRIC_PULL, 0.0), 0.4, uDesktop) *
         TOUCH_AREA *
         uWorldSize) *
        fabric;

    // A tap contracts the fabric even with no pointer movement.
    fabricDisplacement -= fromPulse * (0.16 * uWorldSize) * pulseStrength;

    float split =
        mix(max(RGB_SPLIT_CELLS, 0.0), 14.0, uDesktop) *
        cellSize *
        length(drag) *
        fabric + 32.0 * cellSize * pulseStrength;

    float angle =
    radians(SPLIT_ROTATION_DEG);

// 0° apunta hacia arriba.
// Los valores positivos giran en sentido horario.
vec2 splitDirection =
    vec2(
        sin(angle),
        cos(angle)
    );

vec2 redOffset =
    splitDirection * split;

vec2 greenOffset =
    vec2(0.0);

vec2 blueOffset =
    -splitDirection * split;


    /* RGB LAYERS */

    float redLayer =
        renderDots(
            frag -
            fabricDisplacement -
            redOffset,
            cellSize,
            aspect,
            t,
            seedOffset
        );

    float greenLayer =
        renderDots(
            frag -
            fabricDisplacement -
            greenOffset,
            cellSize,
            aspect,
            t,
            seedOffset
        );

    float blueLayer =
        renderDots(
            frag -
            fabricDisplacement -
            blueOffset,
            cellSize,
            aspect,
            t,
            seedOffset
        );

    vec3 chromaticDots =
        vec3(
            redLayer,
            greenLayer,
            blueLayer
        );

    // La tonalidad aparece gradualmente con la separación.
    // En el borde vuelve al gris sin un corte de color.
    float tintAmount =
        smoothstep(
            0.0,
            0.35,
            length(drag) * fabric
        );

    vec3 tint =
        mix(
            vec3(1.0),
            TOUCH_TINT,
            tintAmount
        );

    vec3 color =
        BG_COLOR +
        chromaticDots *
        tint *
        (DOT_COLOR - BG_COLOR) *
        fade;

    gl_FragColor =
        vec4(color, 1.0);
}
`;
