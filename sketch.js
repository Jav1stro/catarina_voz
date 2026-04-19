// sketch.js — Orquestador: árbol → nodos → trazos

const ANCHO = CFG.ANCHO;
const ALTO  = CFG.ALTO;
const CAPAS = CFG.CAPAS;

let PALETA;
let espina;
let grafo;
let animFrame  = 0;
let FONDO_INICIO;
let FONDO_FINAL;

function setup() {
  let cnv = createCanvas(ANCHO, ALTO);
  cnv.style('box-shadow', '0 0 40px rgba(0,0,0,0.7)');
  colorMode(RGB, 255);
  frameRate(CFG.FPS);

  PALETA       = CFG.COLORES.map(c => color(c[0], c[1], c[2]));
  FONDO_INICIO = color(...CFG.FONDO_INICIO);
  FONDO_FINAL  = color(...CFG.FONDO_FINAL);

  // Fondo exterior inicial
  document.body.style.background = `rgb(${CFG.FONDO_INICIO.join(',')})`;

  _generarComposicion();
}

function draw() {
  if (espina.terminado() && grafo.terminado()) return;

  animFrame++;

  let p    = grafo.progresoPromedio();
  let ease = p * p * (3 - 2 * p);
  let bgColor = lerpColor(FONDO_INICIO, FONDO_FINAL, ease);
  background(bgColor);
  document.body.style.background =
    `rgb(${floor(red(bgColor))},${floor(green(bgColor))},${floor(blue(bgColor))})`;

  espina.actualizar(animFrame);
  grafo.actualizar(animFrame);

  espina.dibujar();
  grafo.dibujar();
}

function _generarComposicion() {
  let semilla = floor(Math.random() * 99999);
  randomSeed(semilla);
  noiseSeed(semilla);

  animFrame = 0;

  espina = new Espina();
  grafo  = new Red();
  grafo.generar(espina);

  loop();
}

// ESPACIO → nueva composición
function keyPressed() {
  if (key === ' ') _generarComposicion();
}
