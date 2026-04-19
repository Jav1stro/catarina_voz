// config.js — Todos los parámetros configurables de la obra.

const CFG = {

  // ── Lienzo ────────────────────────────────────────────────────
  ANCHO: 540,
  ALTO:  810,
  FPS:   30,

  // ── Paleta ────────────────────────────────────────────────────
  // Agregar colores: sumar entradas [R,G,B] y referenciarlas en CAPAS por índice.
  COLORES: [
    [ 30,  94,  74],   // 0 — teal oscuro
    [110, 185, 152],   // 1 — verde claro
    [224, 128,  64],   // 2 — naranja
    [196, 120, 136],   // 3 — rosa
    [240, 232, 216],   // 4 — blanco cálido
    [200, 165,  75],   // 5 — ocre / amarillo
    [ 55,  75, 130],   // 6 — índigo / azul
    [175,  70,  50],   // 7 — rojo ladrillo
    [150, 110, 165],   // 8 — lila / violeta
  ],
  FONDO_INICIO: [238, 232, 218], // blanco cálido
  FONDO_FINAL:  [ 20,  38,  32], // teal oscuro

  // ── Capas visuales ────────────────────────────────────────────
  // Cada capa: idx = índices de COLORES que puede usar, gMult = multiplicador
  // de grosor, alfaMin/Max = rango de opacidad. Las capas se sortean al azar
  // por trazo — agregar capas suma variedad visual.
  CAPAS: [
    { idx: [0, 6, 7],    gMult: 3.0, alfaMin: 155, alfaMax: 220 }, // oscuros/gruesos
    { idx: [0, 1, 5],    gMult: 1.6, alfaMin: 125, alfaMax: 195 }, // vegetales/ocres
    { idx: [2, 3, 7],    gMult: 1.0, alfaMin:  95, alfaMax: 170 }, // cálidos
    { idx: [3, 8, 4],    gMult: 0.6, alfaMin:  70, alfaMax: 155 }, // lilas/claros
    { idx: [1, 5, 6],    gMult: 0.4, alfaMin:  45, alfaMax: 130 }, // finos/acento
  ],

  // ── Árbol / Espina ────────────────────────────────────────────
  ARBOL: {
    DURACION_FACTOR: 0.26,       // px/frame inverso — mayor = espina más lenta
    PESO_NIVEL:      [4.0, 1.0, 0.4], // peso de nodos por nivel: tronco, rama, sub-rama
  },

  TRONCO: {
    LARGO_MIN:   0.48,  // × ALTO
    LARGO_MAX:   0.72,
    GROSOR_MIN:  8.0,
    GROSOR_MAX:  16.0,
    OFFSET_X:    0.12,  // × ANCHO — desvío horizontal del origen
    ANG_JITTER:  0.18,  // rad — variación respecto a -HALF_PI
  },

  RAMAS: {
    NUM_MIN:     5,
    NUM_MAX:     6,    // random(3,6) → 3, 4 o 5
    T_MIN:       0.20, // posición mínima sobre el tronco
    T_MAX:       0.90,
    DIV_MIN:     0.55, // rad — divergencia mínima desde la tangente del tronco
    DIV_MAX:     1.55,
    LARGO_MIN:   0.28, // × troncoLargo
    LARGO_MAX:   0.60,
    GROSOR_MIN:  0.30, // × troncoGrosor
    GROSOR_MAX:  0.55,
    RETRASO_MIN: 3,    // frames de jitter al brotar
    RETRASO_MAX: 12,
  },

  SUB_RAMAS: {
    PROB:        0.65, // probabilidad de generar sub-ramas en cada rama
    NUM_MIN:     1,
    NUM_MAX:     3,
    T_MIN:       0.30, // posición mínima sobre la rama madre
    T_MAX:       0.85,
    DIV_MIN:     0.48, // rad
    DIV_MAX:     1.20,
    LARGO_MIN:   0.25, // × ramaLargo
    LARGO_MAX:   0.52,
    GROSOR_MIN:  0.28, // × ramaGrosor
    GROSOR_MAX:  0.52,
    RETRASO_MIN: 2,
    RETRASO_MAX: 10,
  },

  // ── Red (nodos y cantidad de trazos) ─────────────────────────
  // La cantidad total de trazos ≈ (NODOS_ARBOL + NODOS_EXTRA) × LIBRES_POR_NODO
  RED: {
    NODOS_ARBOL_MIN:  22,  // puntos de origen sobre el árbol (más = más cobertura)
    NODOS_ARBOL_MAX:  32,
    NODOS_EXTRA_MIN:  4,   // nodos flotantes — emergen tras completarse el árbol
    NODOS_EXTRA_MAX:  8,
    LIBRES_MIN:       5,   // trazos que emite cada nodo (mínimo)
    LIBRES_MAX:       9,   // trazos que emite cada nodo (máximo)
    NODO_JITTER_MIN:  2,   // frames de jitter al emerger el nodo
    NODO_JITTER_MAX:  10,
  },

  // ── Trazos ────────────────────────────────────────────────────
  TRAZO: {
    GROSOR_MIN:           1.2,
    GROSOR_MAX:           4.0,  // trazos libres siempre más finos que la espina
    DUR_MIN:              20,   // frames mínimos — piso para trazos muy cortos
    MUESTRAS:             110,
    ALFA_MIN:             130,
    ALFA_MAX:             225,
    LARGO_MIN:            0.25, // × height — recorrido geométrico mínimo
    LARGO_MAX:            0.90, // × height — recorrido geométrico máximo
    DIR_SPREAD:           1.4,  // rad — apertura angular máx. desde la tangente de la rama
    ONDA_MIN:             1.5,  // ciclos de oscilación de grosor en zonas poco densas
    ONDA_MAX:             4.5,  // ciclos en zonas densas
  },

  // ── Pastiche / cobertura del lienzo ──────────────────────────
  // Nodos flotantes: circle-packing — se rechazan si solapan con nodos existentes.
  // Trazos de cobertura: grilla que detecta zonas vacías y dispara trazos hacia ellas.
  PASTICHE: {
    RADIO_NODO:            130, // px — radio mínimo entre nodos flotantes
    INTENTOS_NODO:         300, // intentos máx. para colocar cada nodo flotante
    GRID_COLS:               10, // columnas de la grilla de detección de vacíos
    GRID_ROWS:               16, // filas
    TRAZOS_POR_ZONA_VACIA:   25, // trazos extra que se disparan hacia cada zona vacía
    SPREAD_ZONA:            1.0,// rad — variación angular al apuntar a zona vacía
  },

  // ── Post-proceso de densidad ──────────────────────────────────
  DENSIDAD: {
    RADIO:         145,  // px — radio de influencia para medir densidad local
    FACTOR_SPARSE: 2.2,  // grosor en zonas vacías
    FACTOR_DENSE:  0.55, // grosor en zonas densas
    UMBRAL:        0.45, // densidad máxima del mapeo
    ACCENT_UMBRAL: 2.5,  // trazos más finos que esto no se escalan
    GROSOR_MAX:    10,   // tope de grosor para libres (espina siempre supera esto)
  },

  // ── Nodos ─────────────────────────────────────────────────────
  NODO: {
    RADIO_MIN: 4,
    RADIO_MAX: 11,
    DECAY:     0.88, // decay del pulso por frame
  },

};
