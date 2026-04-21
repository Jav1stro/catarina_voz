// config.js — Parámetros centralizados de Catarina Voz v2

const CONFIG = {

  // ─── CANVAS ──────────────────────────────────────────────────────────────
  CANVAS: {
    ANCHO:  800,
    ALTO:   800,
  },

  // ─── PALETA CROMÁTICA ────────────────────────────────────────────────────
  // lock: umbral de volumen requerido para activar el color (0 = siempre libre)
  PALETA: [
    { id: 0, nombre: 'VERDE_PROFUNDO',   r:  30, g:  94, b:  74, lock: 0.0 },
    { id: 1, nombre: 'VERDE_CLARO',      r: 110, g: 185, b: 152, lock: 0.0 },
    { id: 2, nombre: 'BLANCO_CALIDO',    r: 240, g: 232, b: 216, lock: 0.0 },
    { id: 3, nombre: 'OSCURO_PROFUNDO',  r:  20, g:  38, b:  32, lock: 0.0 },
    { id: 4, nombre: 'NARANJA_VIBRANTE', r: 224, g: 128, b:  64, lock: 0.0 },
    { id: 5, nombre: 'ROSA_ACENTO',      r: 196, g: 120, b: 136, lock: 0.8 },
  ],

  // ─── PINCELES ────────────────────────────────────────────────────────────
  // PINCELES_TINTADOS se genera en setup() como matriz [pincelIndex][colorID]
  PINCELES: {
    RUTAS: [
      'pinceles/trazo01.png',
      'pinceles/trazo02.png',
      'pinceles/trazo03.png',
      'pinceles/trazo04.png',
    ],
    OPACIDAD_BASE:   50,   // 0–255, alpha global de la textura al pre-teñir
    GRADIENTE_COLA:  0.8,  // fracción del ancho con fade de cola (0=sin fade · 1=todo el ancho)
  },

  // ─── GRILLA DE PASTICHE ──────────────────────────────────────────────────
  GRILLA: {
    TAMANO_CELDA: 20,       // px por celda
    DENSIDAD_MAX: 30,       // umbral de saturación visual para debug
  },

  // ─── ESPINAS DE FUERZA ───────────────────────────────────────────────────
  ESPINAS: {
    ORIGEN_X:            0.5,   // fracción del ancho — punto de origen del árbol
    ORIGEN_Y:            0.5,   // fracción del alto
    CANTIDAD_RAIZ:       20,     // espinas primarias (distribuidas radialmente 360°)
    PROB_BIFURCACION:    0.35,  // probabilidad de bifurcar en cada segmento hijo
    VARIACION_ANGULO:    30,    // ± grados de variación aleatoria sobre el ángulo radial
    LONGITUD_MIN:        80,    // px mínimos de una espina
    LONGITUD_MAX:       260,    // px máximos de una espina
    HIJOS_MAX:           3,     // máximo de sub-espinas por espina
    PROFUNDIDAD_MAX:     2,     // niveles de recursión
    BLEND_FUERZA:        0.6,     // 0=solo Perlin · 1=solo espina
    RADIO_INFLUENCIA:    180,   // px — radio de atracción de cada segmento
    PROB_ARCO:           0.5,   // probabilidad de que una espina sea curva
    RADIO_ARCO_MIN:      120,   // px — radio mínimo del arco
    RADIO_ARCO_MAX:      450,   // px — radio máximo del arco
  },

  // ─── MOVIMIENTO / RUIDO ──────────────────────────────────────────────────
  MOVIMIENTO: {
    TRAZOS_MAX:          12,    // trazos activos simultáneamente
    RADIO_ORIGEN_TRAZO:  60,    // px — radio de spawn alrededor del origen
    VIDA_MIN:            60,    // frames mínimos de vida de un trazo
    VIDA_MAX:            300,   // frames máximos de vida de un trazo
    VELOCIDAD_BASE:   1.8,   // px por frame
    ESCALA_RUIDO:     0.0005, // escala del campo Perlin (frecuencia baja = curvas suaves)
    ESCALA_RUIDO_MAX: 0.020, // escala máxima cuando frecuencia de audio es alta
    PASO_TIEMPO:      0.008, // incremento de tiempo en el ruido por frame
    INTERVALO_STAMP:  6,     // frames entre estampas del pincel
  },

  // ─── AUDIO ───────────────────────────────────────────────────────────────
  AUDIO: {
    SUAVIZADO:           0.85,  // smoothing del análisis de amplitud (0–1)
    AMPLITUD_MIN:        0.01,  // por debajo de esto se considera silencio
    ESCALA_PINCEL_MIN:   0.6,   // factor de escala del pincel en silencio
    ESCALA_PINCEL_MAX:   2.2,   // factor de escala del pincel en pico de volumen
    GROSOR_MIN:          0.4,   // factor de grosor mínimo del trazo
    GROSOR_MAX:          1.8,   // factor de grosor máximo del trazo
    FFT_BINS:            64,    // resolución del análisis de frecuencia
  },

  // ─── COMPORTAMIENTO DE PASTICHE ──────────────────────────────────────────
  PASTICHE: {
    // Mezcla / Ensuciado
    ALPHA_DECAY_MEZCLA:  0.85,  // factor multiplicador de alpha al cruzar color distinto
    ALPHA_MIN:          40,     // alpha mínimo antes de que el trazo "muera"

    // Resistencia
    DENSIDAD_UMBRAL_RESIST: 12,  // densidad a partir de la cual se activa el jitter
    JITTER_MAX:              25, // ± grados de desvío por resistencia

    // Empaste
    DENSIDAD_UMBRAL_EMPASTE: 18,  // densidad a partir de la cual crece la escala
    EMPASTE_ESCALA_EXTRA:    0.5, // factor adicional de escala (se suma a la base)
  },

  // ─── FONDO AMBIENTE ──────────────────────────────────────────────────────
  FONDO: {
    COLOR:               { r: 60, g: 100, b: 250 }, // color base del fondo
    VARIACION_COLOR:     150,  // ± variación aleatoria de RGB por origen
    ORIGENES_MAX:        4,    // puntos de origen simultáneos
    EXPANSION_INTERVALO: 3,    // frames entre cada expansión de una celda
    ALPHA_DAB:           4,    // alpha por dab (bajo = acumulación suave tipo acuarela)
    DABS_POR_FRAME:      10,    // dabs de pintura por frame por origen
    RADIO_DAB:           2.5,  // tamaño del dab en múltiplos del tamaño de celda
    DENSIDAD_MUERTE:     2,    // densidad de trazo por encima de la cual no se expande
    ESCALA_RUIDO_FLUJO:  0.004, // escala del campo Perlin que dirige la expansión
    DELAY_INICIO:        2000, // ms a esperar antes de empezar (después del setup)
  },

  // ─── PÁGINA ──────────────────────────────────────────────────────────────
  PAGINA: {
    BODY_BG:       '#182b20',
    CANVAS_SHADOW: '0 0 40px rgba(0,0,0,0.8)',
  },

  // ─── DEBUG ───────────────────────────────────────────────────────────────
  DEBUG: {
    ACTIVO:              true,
    MOSTRAR_GRILLA:      true,
    MOSTRAR_ESPINAS:     true,
    ESPINA_COLOR_RAIZ:   [255, 200,  60],  // RGB — espinas primarias
    ESPINA_COLOR_RAMA:   [160, 220, 160],  // RGB — sub-espinas
  },
};
