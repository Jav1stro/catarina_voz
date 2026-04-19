// sketch.js — Paso 2: capas orgánicas, focos de origen, noise en paths y grosor

const ANCHO = 540;
const ALTO  = 810;

let PALETA;
let trazos = [];

// 4 capas de fondo a primer plano.
// Cada capa define: colores permitidos (índices en PALETA), cantidad de trazos,
// multiplicador de grosor, rango de alfa y zona vertical de origen.
const CAPAS = [
  { idx: [0, 1],       num: 13, gMult: 3.0, alfaMin: 155, alfaMax: 220, yMin: 0.60, yMax: 0.98 },
  { idx: [0, 1, 2],    num: 14, gMult: 1.6, alfaMin: 125, alfaMax: 195, yMin: 0.50, yMax: 0.90 },
  { idx: [2, 3],       num: 10, gMult: 1.0, alfaMin:  95, alfaMax: 170, yMin: 0.42, yMax: 0.84 },
  { idx: [3, 4],       num:  5, gMult: 0.4, alfaMin:  55, alfaMax: 140, yMin: 0.38, yMax: 0.78 },
];

function setup() {
  let cnv = createCanvas(ANCHO, ALTO);
  cnv.style('box-shadow', '0 0 40px rgba(0,0,0,0.7)');
  colorMode(RGB, 255);
  noLoop();

  PALETA = [
    color( 30,  94,  74),  // 0 — teal oscuro
    color(110, 185, 152),  // 1 — verde claro
    color(224, 128,  64),  // 2 — naranja
    color(196, 120, 136),  // 3 — rosa
    color(240, 232, 216),  // 4 — blanco cálido
  ];

  _generarComposicion();
}

function draw() {
  background(20, 38, 32);
  noFill();
  for (let t of trazos) t.dibujar();
}

function _generarComposicion() {
  // Seed nativo JS para que cada ESPACIO dé composición distinta
  let semilla = floor(Math.random() * 99999);
  randomSeed(semilla);
  noiseSeed(semilla);

  trazos = [];

  // 1 o 2 focos: zonas de densidad desde donde emergen los trazos
  let numFocos = floor(random(1, 3));
  let focos = [];
  for (let i = 0; i < numFocos; i++) {
    focos.push(createVector(
      random(ANCHO * 0.22, ANCHO * 0.78),
      random(ALTO  * 0.58, ALTO  * 0.86)
    ));
  }

  // Construir capas en orden (fondo → primer plano)
  for (let c = 0; c < CAPAS.length; c++) {
    let capa = CAPAS[c];
    for (let i = 0; i < capa.num; i++) {
      let origen = _origenNoise(focos, capa.yMin, capa.yMax, c * 50 + i);
      let idxCol = capa.idx[floor(random(capa.idx.length))];
      let col    = PALETA[idxCol];

      let t  = new Trazo(origen.x, origen.y, col, capa.gMult);
      t.alfa = random(capa.alfaMin, capa.alfaMax);
      trazos.push(t);
    }
  }
}

// Origen orgánico: dispersión radial desde un foco guiada por noise
function _origenNoise(focos, yMin, yMax, idx) {
  let foco = focos[floor(random(focos.length))];

  // Ángulo y distancia determinados por noise → dispersión continua y fluida
  let angulo = noise(idx * 0.38)       * TWO_PI * 2.2;
  let dist   = noise(idx * 0.38 + 500) * ANCHO  * 0.32;

  let ox = foco.x + cos(angulo) * dist;
  // Compresión vertical: los trazos emergen más apilados que expandidos
  let oy = foco.y + sin(angulo) * dist * 0.45;

  ox = constrain(ox, ANCHO * 0.05, ANCHO * 0.95);
  oy = constrain(oy, ALTO  * yMin, ALTO  * yMax);

  return createVector(ox, oy);
}

// ESPACIO → nueva composición
function keyPressed() {
  if (key === ' ') {
    _generarComposicion();
    redraw();
  }
}
