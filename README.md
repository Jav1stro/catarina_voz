# Catarina Voz

Obra de pintura generativa controlada por audio, construida con **p5.js**. Inspirada en el trabajo pictórico de Catarina Ferreira.

---

## Concepto

La idea central es que la voz humana —su volumen, timbre y presencia— dirija una pintura que se construye sola en tiempo real. El canvas nunca se limpia: los trazos se acumulan de forma aditiva, igual que capas de óleo, hasta cubrir todo el lienzo.

La paleta tiene colores "bloqueados" que solo se desbloquean al superar ciertos umbrales de amplitud de audio, de modo que la obra revela más color cuanto más intensa es la voz.

---

## Cómo ejecutar

Requiere un servidor HTTP local (por restricción CORS de `loadPixels()`):

```bash
python -m http.server 8000
```

Abrir `http://localhost:8000`.

**Controles:**
| Tecla | Acción |
|-------|--------|
| Click / arrastrar | Activa la pintura (trigger actual) |
| `D` | Mostrar/ocultar overlay de debug |
| `R` | Resetear canvas y regenerar espinas |

---

## Arquitectura

El proyecto está dividido en seis archivos JS con responsabilidades separadas:

```
config.js        → todos los parámetros en un solo lugar (nunca se modifica en runtime)
sketch.js        → ciclo de vida p5.js (preload / setup / draw) + activador de pintura
trazo.js         → cada trazo: movimiento, estampado de pincel y efectos de pastiche
espina.js        → árbol de vectores de fuerza que guían la dirección de los trazos
fondo.js         → relleno ambiental que cubre el lienzo antes de que arranquen los trazos
pasticheGrid.js  → grilla espacial que registra densidad y color por zona del canvas
```

### Flujo por frame

```
_triggerActivo()  ←  mouse / teclado / voz (un solo punto de conexión)
       ↓
draw() cada frame:
  1. FondoAmbiente.update()   → expande el fondo por celdas vacías
  2. Trazo.update() × N       → mueve cada trazo y estampa el pincel
  3. Debug overlay (opcional)
```

### Decisiones de diseño relevantes

**Campo de fuerzas (espinas):** los trazos siguen un árbol de segmentos y arcos que irradian desde el centro del lienzo. El Perlin agrega variación orgánica *alrededor* de esa dirección base, no sobre un ángulo fijo. Esto produce composiciones radiales que varían en cada ejecución.

**Pre-renderizado de pinceles:** los PNGs de pinceles tienen fondo blanco sin canal alpha. En `setup()` se pre-colorean manualmente (4 pinceles × 6 colores = 24 imágenes) invirtiendo el brillo como alpha y aplicando el color de paleta pixel a pixel. Esto evita usar `tint()`, que no funciona correctamente con PNGs de fondo blanco.

**Fondo con ventaja:** `FondoAmbiente` arranca 5 segundos antes que los trazos, para que el lienzo tenga una base pictórica establecida antes de que llegue la "pintura principal". El fondo respeta las celdas que los trazos ya ocuparon.

**Pastiche (interacción de pintura):**
- *Mezcla:* el alpha del trazo cae al pintar sobre un color diferente al suyo
- *Resistencia:* el trazo se vuelve errático (jitter angular) en zonas densamente pintadas
- *Empaste:* el pincel escala hacia arriba en zonas de alta densidad, simulando acumulación de pintura

**`_triggerActivo()`:** función de una línea en `sketch.js` que devuelve un booleano. Es el único punto a modificar para cambiar el disparador de la pintura (actualmente `mouseIsPressed`; en el Hito 5 será la amplitud del micrófono).

---

## Estado actual y próximo paso

| Hito | Estado |
|------|--------|
| 0 — Andamiaje y pinceles pre-coloreados | ✅ |
| 1 — PasticheGrid (grilla de densidad/color) | ✅ |
| 2 — Sistema de trazos base | ✅ |
| 3 — Motor de espinas de fuerza | ✅ |
| 3.5 — Fondo ambiente | ✅ |
| 4 — Comportamiento de pastiche | ✅ |
| **5 — Integración de audio (micrófono)** | 🔲 siguiente |
| 6 — Composición y polish final | 🔲 |

El Hito 5 conectará p5.sound al motor: amplitud → escala del pincel y velocidad, FFT → sinuosidad, y umbral de volumen → desbloqueo de colores de la paleta.
