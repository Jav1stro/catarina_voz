// sketch.js — Hito 3.5 rev: el fondo arranca primero; los trazos esperan DELAY_TRAZOS ms

let pincelesBase      = [];
let PINCELES_TINTADOS;
let grid;
let espinaManager;
let fondoAmbiente;
let trazos            = [];
let _trazosIniciados  = false;

// ─── PRELOAD ──────────────────────────────────────────────────────────────────
function preload() {
  for (const ruta of CONFIG.PINCELES.RUTAS) {
    pincelesBase.push(loadImage(ruta));
  }
}

// ─── SETUP ────────────────────────────────────────────────────────────────────
function setup() {
  createCanvas(CONFIG.CANVAS.ANCHO, CONFIG.CANVAS.ALTO);
  colorMode(RGB, 255);
  imageMode(CENTER);
  frameRate(60);

  PINCELES_TINTADOS = preRenderizarPinceles();
  grid          = new PasticheGrid();
  espinaManager = new EspinaManager();
  fondoAmbiente = new FondoAmbiente();

  document.body.style.background = CONFIG.PAGINA.BODY_BG;
  document.querySelector('canvas').style.boxShadow = CONFIG.PAGINA.CANVAS_SHADOW;

  _limpiarLienzo();
  // Los trazos no arrancan en setup() — esperan DELAY_TRAZOS ms para dar ventaja al fondo
}

// ─── ACTIVADOR DE PINTURA ─────────────────────────────────────────────────────
// Única función a cambiar para conectar otro disparador:
//   Mouse:        () => mouseIsPressed
//   Teclado:      () => keyIsDown(32)   // barra espaciadora
//   Voz (futuro): () => vozActiva       // variable global del audioManager
function _triggerActivo() {
  return keyIsDown(32);
}

// ─── DRAW ─────────────────────────────────────────────────────────────────────
function draw() {
  // Sin background() por frame: la pintura se acumula
  fondoAmbiente.update();

  // El fondo tiene DELAY_TRAZOS ms de ventaja antes de que arranquen los trazos
  if (!_trazosIniciados && millis() >= CONFIG.MOVIMIENTO.DELAY_TRAZOS) {
    _trazosIniciados = true;
    _poblarTrazos();
  }

  // Los trazos solo pintan cuando el activador está activo
  if (_trazosIniciados && _triggerActivo()) {
    for (let i = trazos.length - 1; i >= 0; i--) {
      trazos[i].update();
      if (trazos[i].muerto) {
        trazos.splice(i, 1);
        trazos.push(_nuevoTrazo()); // reemplaza inmediatamente
      }
    }
  }

  if (CONFIG.DEBUG.ACTIVO) {
    if (CONFIG.DEBUG.MOSTRAR_ESPINAS) espinaManager.debug();
    if (CONFIG.DEBUG.MOSTRAR_GRILLA)  grid.debug();
    _debugHUD();
  }
}

// ─── HELPERS INTERNOS ─────────────────────────────────────────────────────────
function _limpiarLienzo() {
  const bg = CONFIG.PALETA[3]; // OSCURO_PROFUNDO
  background(bg.r, bg.g, bg.b);
  grid.reset();
  if (fondoAmbiente) fondoAmbiente.reset();
}

function _poblarTrazos() {
  trazos = [];
  for (let i = 0; i < CONFIG.MOVIMIENTO.TRAZOS_MAX; i++) {
    trazos.push(_nuevoTrazo());
  }
}

// Nace en un radio alrededor del origen con un color libre al azar
function _nuevoTrazo() {
  const ox  = CONFIG.ESPINAS.ORIGEN_X * width;
  const oy  = CONFIG.ESPINAS.ORIGEN_Y * height;
  const r   = CONFIG.MOVIMIENTO.RADIO_ORIGEN_TRAZO;
  const ang = random(TWO_PI);
  const x   = ox + cos(ang) * random(r);
  const y   = oy + sin(ang) * random(r);
  const lib = CONFIG.PALETA.filter(c => c.lock === 0);
  const col = lib[floor(random(lib.length))];
  return new Trazo(x, y, col.id);
}

// ─── PRE-RENDERIZADO DE PINCELES ──────────────────────────────────────────────
function preRenderizarPinceles() {
  const alfa     = CONFIG.PINCELES.OPACIDAD_BASE / 255;
  const resultado = [];

  for (let p = 0; p < pincelesBase.length; p++) {
    const base = pincelesBase[p];
    base.loadPixels();
    const porColor = [];

    for (const color of CONFIG.PALETA) {
      const img = createImage(base.width, base.height);
      img.loadPixels();
      const colaFin = CONFIG.PINCELES.GRADIENTE_COLA; // fracción del ancho donde termina la cola

      for (let i = 0; i < base.pixels.length; i += 4) {
        const brillo = (base.pixels[i] + base.pixels[i+1] + base.pixels[i+2]) / 3;

        // Gradiente de cola: lado izquierdo (back) → transparente, derecho (front) → opaco
        const px       = (i / 4) % base.width;
        const gradCola = px < base.width * colaFin
          ? px / (base.width * colaFin)  // rampa 0→1
          : 1.0;

        img.pixels[i]     = color.r;
        img.pixels[i + 1] = color.g;
        img.pixels[i + 2] = color.b;
        img.pixels[i + 3] = (255 - brillo) * alfa * gradCola;
      }
      img.updatePixels();
      porColor.push(img);
    }

    resultado.push(porColor);
  }
  return resultado;
}

// ─── DEBUG HUD ────────────────────────────────────────────────────────────────
function _debugHUD() {
  const den = grid.getDensidad(mouseX, mouseY);
  const cid = grid.getColorID(mouseX, mouseY);
  const cn  = cid >= 0 ? CONFIG.PALETA[cid].nombre : '—';

  const triggerOn = _trazosIniciados && _triggerActivo();

  fill(0, 0, 0, 150);
  noStroke();
  rect(8, 8, 270, 68, 4);
  fill(200, 200, 200);
  textSize(11);
  textAlign(LEFT, TOP);
  text(`Trazos vivos: ${trazos.length}  |  FPS: ${floor(frameRate())}`, 16, 14);
  text(`Celda: densidad=${den}  colorID=${cid} (${cn})`, 16, 30);
  fill(triggerOn ? [80, 220, 120] : [220, 100, 80]);
  text(`Pintura: ${triggerOn ? 'ACTIVA' : 'en pausa'}`, 16, 46);
  fill(200, 200, 200);
  text('R → reset  ·  D → toggle debug', 16, 60);
}

// ─── TECLADO ──────────────────────────────────────────────────────────────────
function keyPressed() {
  if (key === 'd' || key === 'D') CONFIG.DEBUG.ACTIVO = !CONFIG.DEBUG.ACTIVO;
  if (key === 'r' || key === 'R') {
    espinaManager.generar();
    _limpiarLienzo();
    trazos            = [];
    _trazosIniciados  = false; // el fondo vuelve a tener ventaja desde el reset
  }
}
