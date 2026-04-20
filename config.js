// config.js — Todos los parámetros configurables de la obra.

const CFG = {

  // ── Lienzo ────────────────────────────────────────────────────
  ANCHO: 540,  // ancho del canvas en px
  ALTO:  810,  // alto del canvas en px
  FPS:   30,   // fotogramas por segundo — mayor = animación más fluida pero más CPU

  // ── Paleta ────────────────────────────────────────────────────
  // Cada entrada es un color [R, G, B] referenciable por índice en CAPAS.idx.
  // Comentar un color: los índices de CAPAS se auto-filtran (no rompe la obra).
  COLORES: [
    [ 30,  94,  74],   // 0 — teal oscuro
    [110, 185, 152],   // 1 — verde claro
    [224, 128,  64],   // 2 — naranja
    [196, 120, 136],   // 3 — rosa
    // [240, 232, 216],   // 4 — blanco cálido
    // [200, 165,  75],   // 5 — ocre / amarillo
    // [ 55,  75, 130],   // 6 — índigo / azul
    // [175,  70,  50],   // 7 — rojo ladrillo
    // [150, 110, 165],   // 8 — lila / violeta
  ],
  FONDO_INICIO: [238, 232, 218], // color de fondo al inicio — mayor luminosidad = comienzo más claro
  FONDO_FINAL:  [ 20,  38,  32], // color de fondo al terminar — más oscuro = más contraste final

  // ── Capas visuales ────────────────────────────────────────────
  // Cada trazo sortea una capa al azar. La capa define su "personalidad":
  //   idx     — subconjunto de colores disponibles (índices de COLORES)
  //   gMult   — multiplicador de grosor — mayor = trazos de esa capa más gruesos
  //   alfaMin — opacidad mínima posible (0=invisible, 255=sólido)
  //   alfaMax — opacidad máxima — mayor rango = más variación entre trazos de la capa
  // Las capas gruesas (gMult alto) conviene que tengan alfa bajo para no tapar el pastiche.
  CAPAS: [
    { idx: [0, 6, 7],  gMult: 3.0, alfaMin:  80, alfaMax: 140 }, // oscuros/gruesos — más transparentes
    { idx: [0, 1, 5],  gMult: 1.6, alfaMin:  90, alfaMax: 155 }, // vegetales/ocres
    { idx: [2, 3, 7],  gMult: 1.0, alfaMin:  80, alfaMax: 150 }, // cálidos
    { idx: [3, 8, 4],  gMult: 0.6, alfaMin:  60, alfaMax: 140 }, // lilas/claros
    { idx: [1, 5, 6],  gMult: 0.4, alfaMin:  45, alfaMax: 130 }, // finos/acento
  ],

  // ── Árbol / Espina ────────────────────────────────────────────
  ARBOL: {
    DURACION_FACTOR: 0.26, // frames por px de largo — mayor = árbol crece más lento
    PESO_NIVEL: [4.0, 1.0, 0.4], // probabilidad relativa de nodos en [tronco, rama, sub-rama]
                                  // mayor primer valor = más nodos concentrados en el tronco
  },

  TRONCO: {
    LARGO_MIN:  0.5,  // largo mínimo como fracción del alto del canvas — mayor = tronco más largo
    LARGO_MAX:  0.9,  // largo máximo como fracción del alto del canvas
    GROSOR_MIN: 8.0,  // grosor mínimo en px — mayor = tronco siempre visible y grueso
    GROSOR_MAX: 16.0, // grosor máximo en px — mayor = más variación de grosor posible
    OFFSET_X:   0.12, // desplazamiento horizontal del origen como fracción del ancho — mayor = más descentrado
    ANG_JITTER: 0.18, // variación angular aleatoria respecto a vertical (rad) — mayor = tronco más inclinado
  },

  RAMAS: {
    NUM_MIN:     3,    // cantidad mínima de ramas que brotan del tronco
    NUM_MAX:     4,    // cantidad máxima de ramas — mayor = árbol más frondoso
    T_MIN:       0.10, // posición mínima sobre el tronco donde puede brotar una rama (0=base, 1=punta)
    T_MAX:       0.95, // posición máxima — mayor rango = ramas más distribuidas a lo largo del tronco
    DIV_MIN:     0.55, // divergencia angular mínima desde la tangente del tronco (rad) — mayor = ramas más perpendiculares
    DIV_MAX:     1.55, // divergencia angular máxima — mayor = ramas pueden abrirse casi horizontalmente
    LARGO_MIN:   0.35, // largo mínimo como fracción del largo del tronco — mayor = ramas más largas
    LARGO_MAX:   0.75, // largo máximo como fracción del largo del tronco
    GROSOR_MIN:  0.30, // grosor mínimo como fracción del grosor del tronco — mayor = ramas más gruesas
    GROSOR_MAX:  0.55, // grosor máximo como fracción del grosor del tronco
    RETRASO_MIN: 3,    // frames mínimos de jitter al brotar — mayor = aparición más retrasada
    RETRASO_MAX: 12,   // frames máximos de jitter — mayor = brotado más desincronizado entre ramas
  },

  SUB_RAMAS: {
    PROB:        0.5,  // probabilidad (0–1) de que cada rama genere sub-ramas — mayor = árbol más ramificado
    NUM_MIN:     8,    // cantidad mínima de sub-ramas por rama — mayor = más ramificación fina
    NUM_MAX:     12,   // cantidad máxima de sub-ramas por rama
    T_MIN:       0.8,  // posición mínima sobre la rama madre (0=base, 1=punta) — mayor = sub-ramas más hacia la punta
    T_MAX:       0.85, // posición máxima sobre la rama madre
    DIV_MIN:     0.48, // divergencia angular mínima desde la tangente de la rama (rad)
    DIV_MAX:     1.20, // divergencia angular máxima — mayor = sub-ramas más abiertas
    LARGO_MIN:   0.25, // largo mínimo como fracción del largo de la rama madre
    LARGO_MAX:   0.52, // largo máximo como fracción del largo de la rama madre
    GROSOR_MIN:  0.6,  // grosor mínimo como fracción del grosor de la rama madre
    GROSOR_MAX:  2.5,  // grosor máximo — valores >1 = sub-rama más gruesa que la madre (efecto nódulo)
    RETRASO_MIN: 2,    // frames mínimos de jitter al brotar
    RETRASO_MAX: 10,   // frames máximos de jitter
  },

  // ── Red (nodos y cantidad de trazos) ─────────────────────────
  // Total de trazos ≈ (NODOS_ARBOL + NODOS_EXTRA) × LIBRES_POR_NODO
  RED: {
    NODOS_ARBOL_MIN:  100, // mínimo de nodos colocados sobre las ramas del árbol — mayor = más puntos de origen
    NODOS_ARBOL_MAX:  350, // máximo de nodos sobre el árbol — mayor = más densidad de trazos
    NODOS_EXTRA_MIN:  0,   // nodos flotantes fuera del árbol — 0 = desactivados
    NODOS_EXTRA_MAX:  0,   // mayor = nodos en posiciones random del canvas (puede generar ruido visual)
    LIBRES_MIN:       3,   // trazos mínimos que emite cada nodo — mayor = cada nodo más denso
    LIBRES_MAX:       6,   // trazos máximos por nodo — mayor = más variación de densidad
    NODO_JITTER_MIN:  2,   // frames mínimos de jitter al emerger un nodo
    NODO_JITTER_MAX:  10,  // frames máximos de jitter — mayor = aparición más desincronizada
    COLISION_RADIO:   1,   // radio en px para detectar colisión entre trazos — mayor = trazos se detienen antes de tocarse
    GRID_CELL_SIZE:   50,  // tamaño de celda de la grilla espacial en px — menor = detección más precisa pero más CPU
    FRACCION_MIN:     0.50,// largo mínimo de trazos secundarios relativo al líder (0–1)
                           // mayor = todos los trazos del nodo recorren distancias similares
  },

  // ── Trazos ────────────────────────────────────────────────────
  TRAZO: {
    GROSOR_MIN:           4.0,  // grosor mínimo base en px — mayor = ningún trazo queda muy fino
    GROSOR_MAX:           22.0, // grosor máximo base en px — mayor = más variación de grosores posible
    DUR_MIN:              20,   // duración mínima en frames — mayor = trazos cortos tardan más en dibujarse
    MUESTRAS:             110,  // puntos evaluados por trazo — mayor = curvas más suaves pero más CPU
    ALFA_MIN:             50,   // opacidad mínima de un trazo (0–255) — mayor = ningún trazo queda muy transparente
    ALFA_MAX:             180,  // opacidad máxima — mayor = trazos más sólidos y cubrientes
    LARGO_MIN:            0.40, // recorrido mínimo como fracción del alto del canvas
    LARGO_MAX:            1.30, // recorrido máximo — mayor que 1 = trazos que salen del canvas
    DIR_SPREAD:           0.75, // apertura angular máxima desde la dirección del nodo (rad, ~43°)
                                // mayor = trazos más dispersos; menor = más paralelos y alineados con la espina
    CURV:                 0.12, // curvatura máxima por segmento (× PI) — mayor = trazos más curvados y orgánicos
    ONDA_MIN:             1.5,  // ciclos de onda de grosor en zonas poco densas — mayor = más pulsaciones visibles
    ONDA_MAX:             4.5,  // ciclos de onda en zonas densas — mayor = efecto más vibrante en zonas saturadas
    ALFA_GROSOR_FACTOR_MAX: 1.0,  // factor de alpha aplicado al trazo más fino (1.0 = sin cambio)
    ALFA_GROSOR_FACTOR_MIN: 0.25, // factor de alpha aplicado al trazo más grueso — menor = trazos gruesos más transparentes
  },

  // ── Pastiche / cobertura del lienzo ──────────────────────────
  PASTICHE: {
    RADIO_NODO:           130, // distancia mínima en px entre nodos flotantes — mayor = nodos más separados
    INTENTOS_NODO:        300, // intentos para colocar cada nodo flotante sin solapar — mayor = más persistente
    GRID_COLS:             10, // columnas de la grilla de detección de zonas vacías
    GRID_ROWS:             16, // filas de la grilla — mayor resolución = detección más fina de huecos
    TRAZOS_POR_ZONA_VACIA:  10, // trazos extra hacia celdas sin cobertura — 0 = desactivado; mayor = más relleno automático
    SPREAD_ZONA:           1.0,// variación angular (rad) al apuntar hacia zona vacía — mayor = trazos de relleno más dispersos
  },

  // ── Post-proceso de densidad ──────────────────────────────────
  // Ajusta grosor y alpha de cada trazo según cuántos vecinos tiene cerca.
  // Crea efecto de empaste: zonas vacías tienen trazos más gruesos y visibles.
  DENSIDAD: {
    RADIO:         145,  // radio en px para contar trazos vecinos — mayor = área de influencia más amplia
    FACTOR_SPARSE: 2.5,  // multiplicador de grosor en zonas vacías — mayor = trazos muy gruesos donde hay pocos
    FACTOR_DENSE:  0.65, // multiplicador de grosor en zonas densas — menor = trazos muy finos donde hay muchos
    UMBRAL:        0.45, // densidad relativa máxima del mapeo — mayor = el ajuste aplica a zonas aún más saturadas
    ACCENT_UMBRAL: 3.5,  // trazos con grosorBase menor a este valor no se escalan por densidad — mayor = más trazos exentos
    GROSOR_MAX:    35,   // tope absoluto de grosor en px tras el ajuste — mayor = permite trazos más anchos
  },

  // ── Nodos ─────────────────────────────────────────────────────
  NODO: {
    RADIO_MIN: 4,    // radio mínimo del círculo visual del nodo en px — mayor = nodos siempre grandes
    RADIO_MAX: 11,   // radio máximo — mayor = nodos pueden ser muy prominentes
    DECAY:     0.88, // factor de decaimiento del pulso por frame (0–1) — menor = pulso se apaga rápido; mayor = persiste más
  },

};
