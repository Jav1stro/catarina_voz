// Espina.js — Línea principal ondulante que atraviesa el lienzo de abajo hacia arriba.
// Sirve como eje estructural: los nodos nacen a lo largo de ella.

class Espina {
  constructor() {
    this.nOffset  = random(10000); // seed de noise para la ondulación
    this.nOffsetG = random(10000); // seed separado para variación de grosor
    this.grosor   = random(3.5, 7);
    this.muestras = 240;
    this.progreso = 0;
    this.duracion = 58; // frames a 30fps ≈ 1.9 segundos
    this.retraso  = 0;
    this.pts      = [];

    this._generarCurva();
  }

  // Catmull-Rom ondulante: control points de abajo a arriba con desvíos noise
  _generarCurva() {
    let numCtrl = floor(random(4, 7));

    for (let i = 0; i <= numCtrl; i++) {
      let t  = i / numCtrl;
      let y  = lerp(ALTO * 0.94, ALTO * 0.04, t);
      // Desvío horizontal noise-driven: la curva puede ir de lado a lado del lienzo
      let nv = noise(i * 0.58 + this.nOffset);
      let x  = ANCHO * 0.5 + map(nv, 0, 1, -1, 1) * ANCHO * 0.40;
      x = constrain(x, ANCHO * 0.09, ANCHO * 0.91);
      this.pts.push(createVector(x, y));
    }
  }

  // Evalúa la curva Catmull-Rom en t ∈ [0,1]
  evaluar(t) {
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

  // Devuelve n posiciones a lo largo de la espina para colocar nodos.
  // Las posiciones tienen un pequeño desvío lateral para que no queden
  // exactamente sobre la línea: los nodos "salen" de la espina.
  obtenerPosicionesNodos(n) {
    let posiciones = [];
    for (let i = 0; i < n; i++) {
      // t distribuido con leve irregularidad
      let t  = (i + 0.5) / n + random(-0.04, 0.04);
      t = constrain(t, 0.03, 0.97);
      let pt = this.evaluar(t);

      // Desvío lateral amplio: los nodos pueden estar lejos de la espina
      let desvLat  = random(-ANCHO * 0.36, ANCHO * 0.36);
      let desvVert = random(-28, 28);

      posiciones.push(createVector(
        constrain(pt.x + desvLat,  ANCHO * 0.05, ANCHO * 0.95),
        constrain(pt.y + desvVert, ALTO  * 0.03, ALTO  * 0.97)
      ));
    }
    return posiciones;
  }

  actualizar(frame) {
    if (frame < this.retraso) return;
    this.progreso = min((frame - this.retraso) / this.duracion, 1);
  }

  dibujar() {
    if (this.progreso <= 0) return;

    // La espina usa verde claro (PALETA[1]) para tener buen contraste
    // tanto sobre el fondo blanco inicial como sobre el teal final
    let col    = PALETA[1];
    let limite = floor(this.progreso * this.muestras);
    let prev   = null;

    for (let i = 0; i <= limite; i++) {
      let t  = i / this.muestras;
      let pt = this.evaluar(t);

      // Grosor variable: más grueso en el cuerpo, fino en extremos
      let envolv = sin(t * PI);
      let nGros  = noise(t * 5 + this.nOffsetG);
      let g      = max(0.4, this.grosor * envolv * (0.55 + 0.45 * nGros));

      strokeWeight(g);
      stroke(red(col), green(col), blue(col), 170);
      if (prev) line(prev.x, prev.y, pt.x, pt.y);
      prev = pt;
    }

    // Punta del pincel mientras avanza
    if (this.progreso < 1) {
      let punta = this.evaluar(this.progreso);
      noStroke();
      fill(255, 255, 210, 180);
      ellipse(punta.x, punta.y, 4.5, 4.5);
    }
  }

  terminado() { return this.progreso >= 1; }
}
