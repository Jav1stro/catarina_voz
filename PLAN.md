# PLAN.md — Catarina Voz v2

## Visión General
Obra pictórica generativa controlada por audio, inspirada en Catarina Ferreira.
Motor p5.js con sistema de pinceles pre-teñidos, grilla de pastiche y árbol de espinas de fuerza.

---

## Hito 0 — Andamiaje y Validación Visual ✅ COMPLETADO
**Objetivo:** Establecer la base antes de escribir lógica generativa.

- [x] `PLAN.md` — hoja de ruta aprobada
- [x] `config.js` — parámetros centralizados (paleta, grilla, audio, pastiche)
- [x] `index.html` — shell HTML con carga de librerías
- [x] `sketch.js` — setup() con pre-teñido de pinceles + pantalla de debug

**Decisiones técnicas tomadas:**
- Técnica de pre-coloreado: manipulación directa de píxeles (`brillo invertido → alpha`). Descartados: `tint()` (no funciona con PNGs de fondo blanco) y `mask()` (requiere pixel access igual que loadPixels, sin ventaja).
- Los PNGs de pinceles tienen **fondo blanco y trazo oscuro** (sin canal alpha). La inversión de brillo es el equivalente JS del `filter(INVERT) + mask()` de Processing.
- `PINCELES_TINTADOS` es una **matriz [pincelIdx][colorIdx]** de `p5.Image`. Actualmente: 4 trazos × 6 colores = 24 imágenes pre-generadas en setup().
- El proyecto **requiere servidor HTTP local** para `loadPixels()` (CORS). Se usa Live Server de VS Code.
- Debug rediseñado como grilla filas=trazos × columnas=colores sobre fondo gris neutro.

**Criterio cumplido:** Grilla debug muestra 4 trazos × 6 colores correctamente coloreados sobre fondo gris. NARANJA y ROSA con candado visual.

---

## Hito 1 — PasticheGrid ✅ COMPLETADO
**Objetivo:** Implementar la grilla que registra colorID y densidad por celda.

- [x] Clase `PasticheGrid` en `pasticheGrid.js`
  - `registrar(x, y, colorID)` — actualiza celda
  - `getDensidad(x, y)` — retorna contador
  - `getColorID(x, y)` — retorna último color
  - `debug()` — overlay visual de densidad en modo debug
- [x] Integración en `sketch.js`

**Decisiones técnicas tomadas:**
- `PasticheGrid` usa `Int8Array` (colorID) y `Uint16Array` (densidad) para eficiencia de memoria.
- Debug overlay: líneas de grilla al 5% opacidad + celdas coloreadas con alpha proporcional a densidad.
- Se agregó `CONFIG.PAGINA` (BODY_BG, CANVAS_SHADOW) aplicado desde `setup()` vía JS, sin hardcodear en CSS.

**Criterio cumplido:** Click/drag pinta celdas con colores aleatorios; HUD muestra densidad y colorID bajo el cursor; R resetea.

---

## Hito 2 — Sistema de Trazos Base ✅ COMPLETADO
**Objetivo:** Trazos que se mueven, estampan el pincel pre-teñido y registran en la grilla.

- [x] Clase `Trazo` en `trazo.js`
  - Movimiento con curvatura orgánica por Perlin Noise (offsets únicos por trazo)
  - Estampado del pincel pre-coloreado rotado según dirección de avance
  - Registro en `PasticheGrid` en cada estampa
- [x] Pool de `TRAZOS_MAX` trazos activos; reemplazados inmediatamente al morir
- [x] Cada trazo elige pincel al azar (entre los 4) y color al azar (entre los no-locked) al nacer

**Decisiones técnicas tomadas:**
- La pintura se **acumula** — no hay `background()` por frame.
- El pincel PNG (horizontal) se rota por `this.angulo` para alinear el eje largo con la dirección de avance.
- Escala aleatoria por trazo (0.5–1.0) para variedad de grosor sin audio aún.
- `_nuevoTrazo()` nace en radio alrededor del origen de espinas.

**Criterio cumplido:** 12 trazos simultáneos dejando rastro pictórico acumulativo; grilla registra correctamente.

---

## Hito 3 — Motor de Espinas de Fuerza ✅ COMPLETADO
**Objetivo:** Árbol de vectores que guían múltiples trazos.

- [x] Clase `Espina` en `espina.js`
  - Soporte de **segmentos rectos y arcos** (controlado por `PROB_ARCO`, `RADIO_ARCO_MIN/MAX`)
  - Bug de signo corregido: la dirección de traversal del arco es `-sign` para que la tangente apunte en el sentido correcto
  - Hijos heredan la tangente local del punto de bifurcación (no el ángulo inicial)
  - Colores diferenciados en debug: raíces en amarillo (`ESPINA_COLOR_RAIZ`), sub-espinas en verde (`ESPINA_COLOR_RAMA`)
- [x] `EspinaManager` — distribución radial 360° desde un origen configurable (`ORIGEN_X`, `ORIGEN_Y`)
- [x] Trazos siguen la espina como dirección base; Perlin agrega variación orgánica sobre ella

**Decisiones técnicas tomadas:**
- La fórmula de blend cambió: el Perlin varía **alrededor de la dirección de la espina** (no de `ANGULO_BASE` fijo). Esto permite seguir espinas en cualquier dirección, incluyendo hacia abajo.
- `BLEND_FUERZA`: `1` = sigue la espina exacta · `0` = máxima variación de ruido alrededor de ella.
- Campo de fuerza: media circular ponderada por distancia inversa entre segmentos del árbol.
- Espinas y trazos nacen desde el centro del lienzo (`ORIGEN_X/Y`) y se expanden radialmente.
- Trazos mueren al tocar el borde exacto del canvas (sin margen extra).
- `VIDA_MIN` / `VIDA_MAX` en config permiten mezcla de trazos cortos y largos.
- `GRADIENTE_COLA` hornea un fade en el extremo trasero del pincel para suavizar cambios de dirección.
- Sin valores hardcodeados en el código — todo en `config.js`.

**Criterio cumplido:** Red de espinas (rectas + arcos) visible en overlay debug; trazos siguen la estructura arbórea en cualquier dirección; composición radial desde el centro.

---

## Hito 3.5 — Fondo Ambiente ✅ COMPLETADO
**Objetivo:** Rellenar las zonas vacías del lienzo con color expansivo que simula el fondo pictórico de Catarina Ferreira.

- [x] Clase `FondoOrigen` en `fondo.js` — nace en celda vacía y se expande conquistando territorio
- [x] `FondoAmbiente` — manager de orígenes; cuando uno termina, nace otro en zona libre restante
- [x] `CONFIG.FONDO` — color, variación, origenes, intervalo, alpha, delay, ruido

**Decisiones técnicas tomadas:**
- Se descartaron pinceles PNG para el fondo. La pintura es **geométrica pura**: elipses semitransparentes, sin pre-renderizado.
- Arquitectura de **pintura desacoplada de expansión**: `FondoOrigen` tiene dos mecánicas separadas:
  - *Territorial*: cada `EXPANSION_INTERVALO` frames reclama una celda nueva (frontera de expansión)
  - *Pictórica*: cada frame deposita `DABS_POR_FRAME` elipses muy transparentes (`ALPHA_DAB`) sobre celdas ya reclamadas al azar → el interior acumula color gradualmente (acuarela), los bordes quedan difusos
- El campo Perlin (`ESCALA_RUIDO_FLUJO`) sesga la expansión en direcciones consistentes, creando formas sinuosas en lugar de círculos.
- `celdasOcupadas` es un `Set` compartido entre todos los orígenes para evitar solapamiento.
- El fondo no registra en `PasticheGrid` — solo los trazos registran densidad.
- `fondoAmbiente.update()` se llama **antes** del loop de trazos para que los trazos queden siempre encima visualmente.
- `DELAY_INICIO: 2000` ms — el fondo espera 2 segundos desde el inicio antes de comenzar a expandirse.

**Criterio cumplido:** Las zonas vacías se cubren gradualmente con color acumulativo; el fondo respeta la pintura de los trazos y espera 2 segundos antes de arrancar.

---

## Hito 4 — Comportamiento de Pastiche (Interacción de Pintura) ← SIGUIENTE
**Objetivo:** Los trazos reaccionan a lo que ya está pintado.

- [ ] **Mezcla/Ensuciado:** alpha↓ al cruzar zona de distinto colorID
- [ ] **Resistencia:** jitter angular en celdas de alta densidad
- [ ] **Empaste:** escala↑ del pincel en zonas de alta densidad

**Criterio de paso:** Zonas pintadas muestran fusión cromática visible; nuevos trazos rodean masas densas en lugar de sobreescribirlas crudamente.

---

## Hito 5 — Integración de Audio (p5.sound)
**Objetivo:** Conectar micrófono/audio al motor de trazos.

**Arquitectura de audio:** `CONFIG` define los límites de diseño (min/max). Un `audioManager` produce un estado vivo (amplitud 0–1, fftFactor 0–1) que el código usa para interpolar dentro de esos límites en tiempo real. `CONFIG` nunca se modifica en runtime.

**Parámetros que cambian frame a frame:**
- Amplitud → escala del pincel (`ESCALA_PINCEL_MIN/MAX`) y velocidad del trazo
- FFT agudos → sinuosidad alta (`ESCALA_RUIDO_MAX`); graves → trazos más directos
- Umbral de volumen → desbloqueo de `NARANJA_VIBRANTE` (lock 0.7) y `ROSA_ACENTO` (lock 0.8) para nuevos trazos
- Silencio → trazos se ralentizan pero no mueren

**Parámetros que se fijan al nacer el trazo (no cambian durante su vida):**
- Pincel elegido, color elegido, posición de origen

- [ ] `audioManager` — clase con `amplitud`, `fftFactor`, `coloresLibres()`
- [ ] Integración en `trazo.js` — escala y velocidad moduladas por audio cada frame
- [ ] Integración en `sketch.js` — `_nuevoTrazo()` consulta colores desbloqueados

**Criterio de paso:** Al hablar/cantar cerca del micrófono, la obra responde en grosor, curvatura y paleta de forma notoria.

---

## Hito 6 — Composición y Polish Final
**Objetivo:** La obra funciona como pieza autónoma de 3–5 minutos.

- [ ] Ciclos de vida: trazos nacen, maduran y mueren
- [ ] Re-seed periódico de espinas para evitar estasis
- [ ] Modo presentación: sin overlays, sin UI (tecla `D` toggle)

**Criterio de paso:** Demo grabado de 60 segundos mínimo a 60 FPS sostenidos.

---

## Notas Técnicas Transversales
- `tint()` está **prohibido en draw()** para colorización. Toda colorización ocurre en `preRenderizarPinceles()` durante setup() via manipulación directa de píxeles.
- Los pinceles son `pinceles/trazo01–04.png` (fondo blanco, trazo oscuro, sin canal alpha). El brillo invertido se usa como alpha.
- El proyecto requiere **servidor HTTP local** (Live Server de VS Code) para que `loadPixels()` funcione sin bloqueo CORS.
- Modo debug activable con tecla `D` · Reset con `R`.
- Sin valores hardcodeados en el código — todos los parámetros viven en `config.js`.
- Orden de carga en `index.html`: `config.js → pasticheGrid.js → espina.js → trazo.js → fondo.js → sketch.js`.
