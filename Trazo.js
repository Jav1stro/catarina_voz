// Trazo.js — Curva Catmull-Rom libre desde un nodo.
// Todos los trazos duran lo mismo (DUR_MIN–DUR_MAX), independiente del largo.
// La dirección sigue la tangente de la rama origen ± DIR_SPREAD.
// fase y ondas son asignados por Red tras el cálculo de densidad (pastiche).

class Trazo {
  constructor(nodoOrigen, colorTrazo, grosorMult = 1, angDir = null) {
    this.color      = colorTrazo;
    this.grosorBase = random(CFG.TRAZO.GROSOR_MIN, CFG.TRAZO.GROSOR_MAX) * grosorMult;

    this.nDesvio = random(10000);
    this.nOffset = random(10000);
    this.nFreq   = random(2, 6);

    this.largo        = 0; // asignado en _generarPuntos
    this.pts          = this._generarPuntos(nodoOrigen.pos, angDir);

    // Duración proporcional al largo × factor de la espina → misma velocidad visual
    this.duracionBase = max(CFG.TRAZO.DUR_MIN,
      floor(this.largo * CFG.ARBOL.DURACION_FACTOR));

    this.muestras = CFG.TRAZO.MUESTRAS;
    this.alfa     = random(CFG.TRAZO.ALFA_MIN, CFG.TRAZO.ALFA_MAX);
    this.retraso  = 0;
    this.duracion = this.duracionBase;
    this.progreso = 0;

    // Asignados por Red._calcularOscilaciones() según densidad espacial
    this.ondas = CFG.TRAZO.ONDA_MIN;
    this.fase  = 0;
  }

  // ── Generación de puntos ───────────────────────────────────────
  // angDir: ángulo base (tangente de la rama). null → completamente libre.
  _generarPuntos(posIni, angDir) {
    let pts = [];
    this.largo = random(height * CFG.TRAZO.LARGO_MIN, height * CFG.TRAZO.LARGO_MAX);
    let largo  = this.largo;

    let numCtrl = floor(random(5, 10));
    let paso    = largo / numCtrl;

    // Ángulo inicial: si hay dirección base, se abre un abanico desde ella
    let angInicial = (angDir !== null)
      ? angDir + random(-CFG.TRAZO.DIR_SPREAD, CFG.TRAZO.DIR_SPREAD)
      : random(TWO_PI);

    let x = posIni.x + random(-6, 6);
    let y = posIni.y + random(-6, 6);
    pts.push(createVector(x, y));

    for (let i = 1; i <= numCtrl; i++) {
      // Evolución orgánica del ángulo con noise — curvatura suave, no zigzag
      let nVal = noise(i * 0.42 + this.nDesvio);
      let ang  = angInicial + map(nVal, 0, 1, -PI * 0.45, PI * 0.45);

      x += cos(ang) * paso * random(0.75, 1.25);
      y += sin(ang) * paso * random(0.75, 1.25);

      // El trazo se termina al salir del lienzo — sin rebote
      if (x < 0 || x > width || y < 0 || y > height) break;

      pts.push(createVector(x, y));
    }

    return pts;
  }

  // ── Catmull-Rom ────────────────────────────────────────────────
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

    let limite = floor(this.progreso * this.muestras);
    let prev   = null;

    for (let i = 0; i <= limite; i++) {
      let t  = i / this.muestras;
      let pt = this._evaluar(t);

      // Envolvente principal: arco de presión (cero en extremos)
      let envolv = sin(t * PI);
      // Oscilación de pastiche: expansión/contracción coordinada entre trazos
      let onda   = 1 + 0.4 * sin(t * PI * this.ondas + this.fase);
      // Textura orgánica con noise
      let presion = noise(t * this.nFreq + this.nOffset);
      let grosor  = max(0.2, this.grosorBase * envolv * onda * (0.55 + 0.45 * presion));

      strokeWeight(grosor);
      stroke(red(this.color), green(this.color), blue(this.color), this.alfa);
      noFill();
      if (prev) line(prev.x, prev.y, pt.x, pt.y);
      prev = pt;
    }

    // Punta del pincel mientras el trazo crece
    if (this.progreso < 1) {
      let punta = this._evaluar(this.progreso);
      noStroke();
      fill(255, 255, 230, 150);
      ellipse(punta.x, punta.y, 3.5, 3.5);
    }
  }
}
