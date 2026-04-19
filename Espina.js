// Espina.js — Árbol orgánico: tronco + ramas + sub-ramas.
// Cada Rama es una curva Catmull-Rom que crece progresivamente.
// Los nodos de Red nacen a lo largo de todas las ramas del árbol.

class Rama {
  constructor(posInicio, anguloInicial, largo, grosorBase, nivel) {
    this.largo      = largo;
    this.grosorBase = grosorBase;
    this.nivel      = nivel;     // 0 = tronco, 1 = rama, 2 = sub-rama
    this.nOffset    = random(10000);
    this.nOffsetG   = random(10000);
    this.pts        = [];
    this.progreso   = 0;
    this.retraso    = 0;
    this.duracion   = max(18, floor(largo * CFG.ARBOL.DURACION_FACTOR));
    this.muestras   = max(60, floor(largo * 0.30));
    this._generarCurva(posInicio, anguloInicial);
  }

  _generarCurva(posInicio, anguloInicial) {
    let numCtrl = floor(random(4, 8));
    let x   = posInicio.x;
    let y   = posInicio.y;
    let ang = anguloInicial;

    this.pts.push(createVector(x, y));

    for (let i = 1; i <= numCtrl; i++) {
      let paso = this.largo / numCtrl;
      let nVal = noise(i * 0.55 + this.nOffset);
      let curv = (this.nivel === 0) ? PI * 0.18 : PI * 0.28;
      ang += map(nVal, 0, 1, -curv, curv);

      x += cos(ang) * paso * random(0.8, 1.2);
      y += sin(ang) * paso * random(0.8, 1.2);

      x = constrain(x, ANCHO * 0.04, ANCHO * 0.96);
      y = constrain(y, ALTO  * 0.02, ALTO  * 0.98);

      this.pts.push(createVector(x, y));
    }
  }

  // Catmull-Rom en t ∈ [0,1]
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

  // Tangente normalizada en t — usada para orientar ramas hijas
  tangente(t) {
    let n      = this.pts.length - 1;
    let seg    = constrain(floor(t * n), 0, n - 1);
    let localT = t * n - seg;

    let i0 = max(0, seg - 1);
    let i1 = seg;
    let i2 = min(n, seg + 1);
    let i3 = min(n, seg + 2);

    let tx = curveTangent(this.pts[i0].x, this.pts[i1].x, this.pts[i2].x, this.pts[i3].x, localT);
    let ty = curveTangent(this.pts[i0].y, this.pts[i1].y, this.pts[i2].y, this.pts[i3].y, localT);
    let len = sqrt(tx * tx + ty * ty);
    if (len < 0.001) return createVector(0, -1);
    return createVector(tx / len, ty / len);
  }

  // Frame en que la punta de la rama llega a t — para sincronizar ramas hijas y nodos
  frameEnT(t) {
    return this.retraso + floor(t * this.duracion);
  }

  actualizar(frame) {
    if (frame < this.retraso) return;
    this.progreso = min((frame - this.retraso) / this.duracion, 1);
  }

  dibujar() {
    if (this.progreso <= 0) return;

    let col   = this._colorPorNivel();
    let limit = floor(this.progreso * this.muestras);
    let prev  = null;

    for (let i = 0; i <= limit; i++) {
      let t  = i / this.muestras;
      let pt = this.evaluar(t);

      let envolv = sin(t * PI * 0.5 + PI * 0.5); // 1 en la base, 0 en la punta
      let nGros  = noise(t * 4.5 + this.nOffsetG);
      let g      = max(0.3, this.grosorBase * envolv * (0.5 + 0.5 * nGros));

      strokeWeight(g);
      stroke(red(col), green(col), blue(col), 175);
      noFill();
      if (prev) line(prev.x, prev.y, pt.x, pt.y);
      prev = pt;
    }

    if (this.progreso < 1) {
      let punta = this.evaluar(this.progreso);
      noStroke();
      fill(255, 255, 210, 185);
      ellipse(punta.x, punta.y, 4, 4);
    }
  }

  _colorPorNivel() {
    if (this.nivel === 0) return PALETA[0]; // teal oscuro
    if (this.nivel === 1) return PALETA[1]; // verde claro
    return PALETA[2];                        // naranja
  }

  terminado() { return this.progreso >= 1; }
}

// ─────────────────────────────────────────────────────────────────────────────

class Espina {
  constructor() {
    this.ramas    = [];
    this.retraso  = 0;
    this.duracion = 0; // frame en que termina la última rama
    this._generarArbol();
  }

  _generarArbol() {
    let TR = CFG.TRONCO;
    let RA = CFG.RAMAS;
    let SR = CFG.SUB_RAMAS;

    // ── Tronco (nivel 0) ────────────────────────────────────────
    let troncoLargo  = random(ALTO * TR.LARGO_MIN, ALTO * TR.LARGO_MAX);
    let troncoGrosor = random(TR.GROSOR_MIN, TR.GROSOR_MAX);
    let troncoIni    = createVector(
      ANCHO * 0.5 + random(-ANCHO * TR.OFFSET_X, ANCHO * TR.OFFSET_X),
      ALTO  * 0.96
    );
    let troncoAng = -HALF_PI + random(-TR.ANG_JITTER, TR.ANG_JITTER);

    let tronco = new Rama(troncoIni, troncoAng, troncoLargo, troncoGrosor, 0);
    tronco.retraso = 0;
    this.ramas.push(tronco);

    // ── Ramas nivel 1 ───────────────────────────────────────────
    let numRamas  = floor(random(RA.NUM_MIN, RA.NUM_MAX));
    let tPosRamas = [];
    for (let i = 0; i < numRamas; i++) {
      tPosRamas.push(random(RA.T_MIN, RA.T_MAX));
    }
    tPosRamas.sort((a, b) => a - b);

    let lado = random() < 0.5 ? 1 : -1;

    for (let i = 0; i < numRamas; i++) {
      let tBifurc = tPosRamas[i];
      let posBif  = tronco.evaluar(tBifurc);
      let tanDir  = tronco.tangente(tBifurc);
      let angBase = atan2(tanDir.y, tanDir.x);

      let div     = lerp(RA.DIV_MIN, RA.DIV_MAX, tBifurc) * lado;
      let ramaAng = angBase + div;

      let ramaLargo  = troncoLargo * random(RA.LARGO_MIN, RA.LARGO_MAX) * (1 - tBifurc * 0.45);
      let ramaGrosor = troncoGrosor * random(RA.GROSOR_MIN, RA.GROSOR_MAX);

      let rama = new Rama(posBif, ramaAng, ramaLargo, ramaGrosor, 1);
      rama.retraso = tronco.frameEnT(tBifurc) + floor(random(RA.RETRASO_MIN, RA.RETRASO_MAX));
      this.ramas.push(rama);

      // ── Sub-ramas (nivel 2) ────────────────────────────────────
      if (random() < SR.PROB) {
        let numSub = floor(random(SR.NUM_MIN, SR.NUM_MAX));
        for (let s = 0; s < numSub; s++) {
          let tSub   = random(SR.T_MIN, SR.T_MAX);
          let posSub = rama.evaluar(tSub);
          let tanSub = rama.tangente(tSub);
          let angSub = atan2(tanSub.y, tanSub.x);

          let divSub    = random(SR.DIV_MIN, SR.DIV_MAX) * (random() < 0.5 ? 1 : -1);
          let subAng    = angSub + divSub;
          let subLargo  = ramaLargo * random(SR.LARGO_MIN, SR.LARGO_MAX);
          let subGrosor = ramaGrosor * random(SR.GROSOR_MIN, SR.GROSOR_MAX);

          let subRama = new Rama(posSub, subAng, subLargo, subGrosor, 2);
          subRama.retraso = rama.frameEnT(tSub) + floor(random(SR.RETRASO_MIN, SR.RETRASO_MAX));
          this.ramas.push(subRama);
        }
      }

      lado *= -1;
    }

    this.duracion = max(...this.ramas.map(r => r.retraso + r.duracion));
  }

  // Retorna n posiciones exactas sobre las ramas como { pos, rama, t }
  obtenerPosicionesNodos(n) {
    let posiciones = [];

    const W        = CFG.ARBOL.PESO_NIVEL;
    let largoTotal = this.ramas.reduce((acc, r) => acc + r.largo * W[r.nivel], 0);
    let asignados  = this.ramas.map(r => max(1, floor(n * r.largo * W[r.nivel] / largoTotal)));

    let diff = n - asignados.reduce((a, b) => a + b, 0);
    for (let i = 0; i < abs(diff); i++) {
      asignados[i % this.ramas.length] = max(1, asignados[i % this.ramas.length] + (diff > 0 ? 1 : -1));
    }

    for (let ri = 0; ri < this.ramas.length; ri++) {
      let rama = this.ramas[ri];
      let num  = asignados[ri];

      for (let i = 0; i < num; i++) {
        let t = constrain((i + 0.5) / num + random(-0.05, 0.05), 0.04, 0.96);
        posiciones.push({ pos: rama.evaluar(t).copy(), rama, t });
      }
    }

    return posiciones;
  }

  actualizar(frame) {
    for (let r of this.ramas) r.actualizar(frame);
  }

  dibujar() {
    for (let r of this.ramas) r.dibujar();
  }

  terminado() {
    return this.ramas.every(r => r.terminado());
  }
}
