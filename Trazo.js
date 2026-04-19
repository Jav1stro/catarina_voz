// Trazo.js — Catmull-Rom entre dos nodos o desde un nodo hacia punto libre.
// fraccionFin: fracción del camino que realmente se dibuja (1.0 = completo, 0.5 = mitad).
// duracionBase: proporcional a la longitud real del trazo.

class Trazo {
  constructor(nodoOrigen, nodoDestino, colorTrazo, grosorMult = 1) {
    this.color      = colorTrazo;
    this.grosorBase = random(1.2, 6.5) * grosorMult;

    this.nDesvio = random(10000);
    this.nOffset = random(10000);
    this.nFreq   = random(2, 6);

    // fraccionFin: cuánto del camino se dibuja (1.0 = hasta el nodo destino)
    // Se puede sobreescribir desde Red antes de _asignarTiempos
    this.fraccionFin = 1.0;

    if (nodoDestino === null) {
      this.pts = this._generarPuntosLibres(nodoOrigen.pos);
    } else {
      this.pts = this._generarPuntosEntre(nodoOrigen.pos, nodoDestino.pos);
    }

    // Duración proporcional a la longitud: trazos cortos → rápidos
    let velocidad     = random(3, 6); // px/frame a 30fps (más lento)
    this.duracionBase = max(28, floor(this.longitud / velocidad));

    this.muestras = 110;
    this.alfa     = random(130, 225);
    this.retraso  = 0;
    this.duracion = this.duracionBase;
    this.progreso = 0;
  }

  // ── Nodo → Nodo ────────────────────────────────────────────
  _generarPuntosEntre(posIni, posFin) {
    let pts = [];
    let j   = 9;
    let ini = createVector(posIni.x + random(-j, j), posIni.y + random(-j, j));
    let fin = createVector(posFin.x + random(-j, j), posFin.y + random(-j, j));

    this.longitud = ini.dist(fin);

    if (this.longitud < 14) {
      pts.push(ini); pts.push(fin);
      return pts;
    }

    let dir  = fin.copy().sub(ini).normalize();
    let perp = createVector(-dir.y, dir.x);
    let numCtrl = floor(random(3, 7));

    pts.push(ini);
    for (let i = 1; i < numCtrl; i++) {
      let t    = i / numCtrl;
      let base = createVector(lerp(ini.x, fin.x, t), lerp(ini.y, fin.y, t));
      let nVal = noise(i * 0.62 + this.nDesvio);
      let desv = map(nVal, 0, 1, -1, 1) * min(this.longitud * 0.34, 165);
      pts.push(createVector(base.x + perp.x * desv, base.y + perp.y * desv));
    }
    pts.push(fin);

    return pts;
  }

  // ── Nodo → Punto libre ─────────────────────────────────────
  // Puede ir en CUALQUIER dirección: arriba, costados, diagonal, abajo.
  // La dirección inicial es aleatoria y evoluciona suavemente con noise.
  _generarPuntosLibres(posIni) {
    let pts    = [];
    let largo  = random(height * 0.32, height * 0.90);
    this.longitud = largo;

    let numCtrl   = floor(random(5, 11));
    let paso      = largo / numCtrl;

    // Ángulo inicial libre: cualquier dirección
    let angInicial = random(TWO_PI);

    let x = posIni.x + random(-7, 7);
    let y = posIni.y + random(-7, 7);
    pts.push(createVector(x, y));

    for (let i = 1; i <= numCtrl; i++) {
      // El ángulo evoluciona orgánicamente con noise (curva suave, no zigzag)
      let nVal = noise(i * 0.42 + this.nDesvio);
      let ang  = angInicial + map(nVal, 0, 1, -PI * 0.6, PI * 0.6);

      x += cos(ang) * paso * random(0.7, 1.3);
      y += sin(ang) * paso * random(0.7, 1.3);

      // Rebote suave en los bordes: el trazo se doblega sin salir del lienzo
      if (x < width  * 0.03) x = lerp(x, width  * 0.09, 0.5);
      if (x > width  * 0.97) x = lerp(x, width  * 0.91, 0.5);
      if (y < height * 0.01) y = lerp(y, height * 0.06, 0.5);
      if (y > height * 0.99) y = lerp(y, height * 0.93, 0.5);

      pts.push(createVector(x, y));
    }

    return pts;
  }

  // ── Catmull-Rom ────────────────────────────────────────────
  _evaluar(t) {
    let n      = this.pts.length - 1;
    let seg    = constrain(floor(t * n), 0, n - 1);
    let localT = t * n - seg;

    let i0 = max(0, seg - 1);
    let i1 = seg;
    let i2 = min(n, seg + 1);
    let i3 = min(n, seg + 2);

    return createVector(
      curvePoint(this.pts[i0].x, this.pts[i1].x, this.pts[i2].x, this.pts[i3].x, localT),
      curvePoint(this.pts[i0].y, this.pts[i1].y, this.pts[i2].y, this.pts[i3].y, localT)
    );
  }

  actualizar(frame) {
    if (frame < this.retraso) return;
    this.progreso = min((frame - this.retraso) / this.duracion, 1);
  }

  dibujar() {
    if (this.progreso <= 0) return;

    // Posición actual del pincel = progreso × fracción máxima del trazo
    let tActual = this.progreso * this.fraccionFin;
    let limite  = floor(tActual * this.muestras);
    let prev    = null;

    for (let i = 0; i <= limite; i++) {
      let t  = i / this.muestras;
      let pt = this._evaluar(t);

      // Presión: noise orgánico × envolvente sinusoidal
      let presion = noise(t * this.nFreq + this.nOffset);
      let envolv  = sin(t * PI);
      let grosor  = max(0.2, this.grosorBase * presion * 1.9 * envolv);

      strokeWeight(grosor);
      stroke(red(this.color), green(this.color), blue(this.color), this.alfa);

      if (prev) line(prev.x, prev.y, pt.x, pt.y);
      prev = pt;
    }

    // Punta del pincel mientras el trazo está creciendo
    if (this.progreso < 1) {
      let punta = this._evaluar(tActual);
      noStroke();
      fill(255, 255, 230, 150);
      ellipse(punta.x, punta.y, 3.5, 3.5);
    }
  }
}
