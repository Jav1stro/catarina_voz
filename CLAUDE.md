# CLAUDE.md

Este archivo provee orientación a Claude Code (claude.ai/code) cuando trabaja con el código de este repositorio.

## Qué es este proyecto

Obra de pintura generativa controlada por audio, construida con **p5.js**. Trazos de pincel se mueven por el canvas guiados por un campo de fuerzas procedural (espinas) y ruido Perlin, acumulando pintura sin limpiar el canvas. Inspirada en la artista Catarina Ferreira.

## Cómo ejecutar el proyecto

No hay paso de compilación — JavaScript puro cargado vía CDN.

Se **requiere** un servidor HTTP local (restricción CORS de `loadPixels()`):

```bash
python -m http.server 8000
# o
npx http-server
```

Luego abrir `http://localhost:8000`.

**Controles:**
- **Click/arrastrar mouse** — activa la pintura
- **D** — alternar overlay de debug (grilla, espinas, FPS/HUD)
- **R** — resetear canvas, regenerar espinas, limpiar trazos

No hay suite de tests ni linter.

## Arquitectura

### Flujo de datos

```
Trigger de entrada (_triggerActivo)
        ↓
Loop draw() cada frame:
  1. FondoAmbiente.update()   → expansión territorial del fondo
  2. Trazo.update() × N       → movimiento de trazos + estampado de pintura
  3. Overlay de debug (opcional)

Cada trazo consulta:
  - EspinaManager.getFuerza(x, y)       → guía direccional
  - PasticheGrid.getDensidad/getColorID → mezcla/resistencia/empasto
```

### Responsabilidades de cada componente

| Archivo | Rol |
|---------|-----|
| `config.js` | Fuente única de verdad para todos los parámetros — nunca se modifica en runtime |
| `sketch.js` | Ciclo de vida (`preload/setup/draw`), despacho de input vía `_triggerActivo()`, pre-renderizado de pinceles |
| `trazo.js` | Movimiento y estampado de cada trazo; implementa mezcla de pintura, resistencia y empasto |
| `espina.js` | Árbol de campo de fuerzas procedural; `getFuerza(x, y)` devuelve ángulo direccional ponderado |
| `fondo.js` | Relleno ambiental del fondo que se expande territorialmente por celdas vacías |
| `pasticheGrid.js` | Grilla espacial (celdas de 20px) que registra densidad y último color por celda |

### Mecánicas clave

**Acumulación en canvas:** `background()` nunca se llama en `draw()` — los trazos se acumulan de forma aditiva.

**Colorización de pinceles:** `preRenderizarPinceles()` en setup manipula píxeles directamente (sin `tint()`) para pre-colorear cada PNG de pincel por color de paleta. El resultado se guarda en `PINCELES_TINTADOS`.

**Punto de trigger:** `_triggerActivo()` en `sketch.js` es el único punto de control que activa la pintura. Actualmente devuelve `mouseIsPressed`. El Hito 5 lo reemplazará con detección de voz/amplitud.

**Retraso del fondo:** `FondoAmbiente` tiene 5000ms de ventaja antes de que comiencen los trazos, para que el fondo se establezca primero.

**Mezcla de pintura (Hito 4):**
- *Mezcla*: el alpha decae al estampar sobre un color diferente
- *Resistencia*: se agrega jitter angular en celdas de alta densidad
- *Empasto*: la escala del estampado aumenta en celdas densas

## Parámetros de configuración clave

Todos los valores ajustables viven en `config.js` bajo el objeto `CONFIG`:

- Cantidad de trazos: `CONFIG.MOVIMIENTO.TRAZOS_MAX`
- Tipo de trigger: cambiar el valor de retorno en `_triggerActivo()` (`sketch.js:43`)
- Paleta/colores: `CONFIG.PALETA` (cada color tiene un `umbralDesbloqueo` de audio)
- Estructura de espinas: `CONFIG.ESPINAS.CANTIDAD_RAIZ`, `PROB_BIFURCACION`
- Sensibilidad de mezcla: `CONFIG.PASTICHE.ALPHA_DECAY_MEZCLA`
- Velocidad de expansión del fondo: `CONFIG.FONDO.EXPANSION_INTERVALO`

## Próximo hito (Hito 5 — Integración de audio)

Aún no implementado. Plan:
- Crear clase `audioManager` usando p5.sound (ya cargado en `index.html`)
- Amplitud → escala del pincel y velocidad de trazos
- Frecuencias altas FFT → sinuosidad del ruido Perlin
- Umbral de amplitud → desbloquear entradas de paleta `NARANJA_VIBRANTE` y `ROSA_ACENTO`
- Establecer global `vozActiva`; cambiar `_triggerActivo()` para consultarla

Ver `PLAN.md` para la especificación técnica completa.

## Assets

PNGs de pinceles en `pinceles/` (fondo blanco, trazo oscuro, sin canal alpha). Deben servirse por HTTP.
