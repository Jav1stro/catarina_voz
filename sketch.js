// sketch.js — Orquestador: espina → nodos → trazos

const ANCHO = 540;
const ALTO  = 810;

let PALETA;

const CAPAS = [
  { idx: [0, 1],    gMult: 3.0, alfaMin: 155, alfaMax: 220 },
  { idx: [0, 1, 2], gMult: 1.6, alfaMin: 125, alfaMax: 195 },
  { idx: [2, 3],    gMult: 1.0, alfaMin:  95, alfaMax: 170 },
  { idx: [3, 4],    gMult: 0.4, alfaMin:  55, alfaMax: 140 },
];

let espina;
let grafo;
let animFrame  = 0;
let FONDO_INICIO;
let FONDO_FINAL;

function setup() {
  let cnv = createCanvas(ANCHO, ALTO);
  cnv.style('box-shadow', '0 0 40px rgba(0,0,0,0.7)');
  colorMode(RGB, 255);
  frameRate(30);

  PALETA = [
    color( 30,  94,  74),  // 0 — teal oscuro
    color(110, 185, 152),  // 1 — verde claro
    color(224, 128,  64),  // 2 — naranja
    color(196, 120, 136),  // 3 — rosa
    color(240, 232, 216),  // 4 — blanco cálido
  ];

  FONDO_INICIO = color(238, 232, 218); // blanco cálido
  FONDO_FINAL  = color( 20,  38,  32); // teal oscuro

  _generarComposicion();
}

function draw() {
  if (espina.terminado() && grafo.terminado()) return;

  animFrame++;

  // Fondo sincronizado con el progreso del grafo
  let p    = grafo.progresoPromedio();
  let ease = p * p * (3 - 2 * p);
  background(lerpColor(FONDO_INICIO, FONDO_FINAL, ease));

  // Orden de dibujado: espina debajo, trazos encima
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

// ESPACIO → nueva composición desde blanco
function keyPressed() {
  if (key === ' ') _generarComposicion();
}
