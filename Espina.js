// espina.js — Hito 3 (arcos + rectas)

// ─── ESPINA ───────────────────────────────────────────────────────────────────
class Espina {
  constructor(x, y, angulo, longitud, profundidad) {
    this.x           = x;
    this.y           = y;
    this.angulo      = angulo;
    this.longitud    = longitud;
    this.profundidad = profundidad;
    this.hijos       = [];

    // Decidir si es recta o arco
    if (random() < CONFIG.ESPINAS.PROB_ARCO) {
      const r = random(CONFIG.ESPINAS.RADIO_ARCO_MIN, CONFIG.ESPINAS.RADIO_ARCO_MAX);
      this.curvatura = random() < 0.5 ? r : -r; // positivo=izquierda · negativo=derecha
    } else {
      this.curvatura = 0;
    }

    // Calcular puntos a lo largo del camino (recta o arco)
    this._puntos = this._computarPuntos(20);

    const ultimo   = this._puntos[this._puntos.length - 1];
    this.xFin      = ultimo.x;
    this.yFin      = ultimo.y;
    this.anguloFin = ultimo.a;

    if (profundidad < CONFIG.ESPINAS.PROFUNDIDAD_MAX) {
      this._bifurcar();
    }
  }

  // Devuelve array de {x, y, a} con N+1 puntos a lo largo del camino
  _computarPuntos(N) {
    const pts = [];

    if (this.curvatura === 0) {
      // Segmento recto
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        pts.push({
          x: this.x + cos(this.angulo) * this.longitud * t,
          y: this.y + sin(this.angulo) * this.longitud * t,
          a: this.angulo,
        });
      }
    } else {
      // Arco
      // sign > 0 → curva a la izquierda (centro a la izquierda de la dirección de avance)
      const sign        = this.curvatura > 0 ? 1 : -1;
      const absR        = abs(this.curvatura);
      // Centro de curvatura: perpendicular al ángulo de avance
      const perpAngulo  = this.angulo - sign * HALF_PI;
      const cx          = this.x + cos(perpAngulo) * absR;
      const cy          = this.y + sin(perpAngulo) * absR;
      const startAngle  = atan2(this.y - cy, this.x - cx);
      const arcSweep    = this.longitud / absR; // radianes totales del arco

      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const a = startAngle - sign * arcSweep * t;
        pts.push({
          x: cx + cos(a) * absR,
          y: cy + sin(a) * absR,
          a: a - sign * HALF_PI,   // tangente en ese punto
        });
      }
    }

    return pts;
  }

  _bifurcar() {
    for (let i = 0; i < CONFIG.ESPINAS.HIJOS_MAX; i++) {
      if (random() > CONFIG.ESPINAS.PROB_BIFURCACION) continue;

      // Punto de nacimiento sobre el camino de esta espina
      const t   = random(0.25, 0.85);
      const idx = floor(t * (this._puntos.length - 1));
      const pt  = this._puntos[idx];

      // El hijo hereda la tangente local + desviación
      const devMax   = radians(CONFIG.ESPINAS.VARIACION_ANGULO) * (1 + this.profundidad * 0.3);
      const anguloH  = pt.a + random(-devMax, devMax);
      const longH    = random(CONFIG.ESPINAS.LONGITUD_MIN, CONFIG.ESPINAS.LONGITUD_MAX) *
                       map(this.profundidad, 0, CONFIG.ESPINAS.PROFUNDIDAD_MAX, 1.0, 0.5);

      this.hijos.push(new Espina(pt.x, pt.y, anguloH, longH, this.profundidad + 1));
    }
  }

  // Agrega segmentos consecutivos del camino a `lista` (para el campo de fuerza)
  recolectarSegmentos(lista) {
    for (let i = 0; i < this._puntos.length - 1; i++) {
      const p1 = this._puntos[i];
      const p2 = this._puntos[i + 1];
      lista.push({
        x1: p1.x, y1: p1.y,
        x2: p2.x, y2: p2.y,
        angulo: p1.a,
        profundidad: this.profundidad,
      });
    }
    for (const h of this.hijos) h.recolectarSegmentos(lista);
  }

  debug() {
    const t   = map(this.profundidad, 0, CONFIG.ESPINAS.PROFUNDIDAD_MAX, 1, 0);
    const alf = map(t, 0, 1, 40, 180);
    const sw  = map(t, 0, 1, 0.6, 2.2);

    const col = this.profundidad === 0
      ? CONFIG.DEBUG.ESPINA_COLOR_RAIZ
      : CONFIG.DEBUG.ESPINA_COLOR_RAMA;
    stroke(col[0], col[1], col[2], alf);
    strokeWeight(sw);
    noFill();

    beginShape();
    for (const p of this._puntos) vertex(p.x, p.y);
    endShape();

    // Flecha en el extremo final
    const fin = this._puntos[this._puntos.length - 1];
    push();
    translate(fin.x, fin.y);
    rotate(fin.a);
    stroke(col[0], col[1], col[2], alf * 0.6);
    const sz = map(t, 0, 1, 3, 7);
    line(0, 0, -sz, -sz * 0.5);
    line(0, 0, -sz,  sz * 0.5);
    pop();

    for (const h of this.hijos) h.debug();
  }
}

// ─── ESPINA MANAGER ───────────────────────────────────────────────────────────
class EspinaManager {
  constructor() {
    this.raices    = [];
    this.segmentos = [];
    this.generar();
  }

  generar() {
    this.raices    = [];
    this.segmentos = [];

    const n   = CONFIG.ESPINAS.CANTIDAD_RAIZ;
    const ox  = CONFIG.ESPINAS.ORIGEN_X * width;
    const oy  = CONFIG.ESPINAS.ORIGEN_Y * height;
    const dev = radians(CONFIG.ESPINAS.VARIACION_ANGULO);

    for (let i = 0; i < n; i++) {
      // Ángulos distribuidos uniformemente en 360°, con variación aleatoria
      const anguloBase = (i / n) * TWO_PI + random(-dev, dev);
      const longitud   = random(CONFIG.ESPINAS.LONGITUD_MAX, CONFIG.ESPINAS.LONGITUD_MAX * 2.2);

      const e = new Espina(ox, oy, anguloBase, longitud, 0);
      this.raices.push(e);
      e.recolectarSegmentos(this.segmentos);
    }
  }

  // Media circular ponderada por distancia inversa
  getFuerza(x, y) {
    const radio = CONFIG.ESPINAS.RADIO_INFLUENCIA;
    let sumPeso = 0, sumSin = 0, sumCos = 0;

    for (const seg of this.segmentos) {
      const dx   = seg.x2 - seg.x1;
      const dy   = seg.y2 - seg.y1;
      const len2 = dx * dx + dy * dy;
      const t    = len2 > 0
        ? constrain(((x - seg.x1) * dx + (y - seg.y1) * dy) / len2, 0, 1)
        : 0;
      const d = dist(x, y, seg.x1 + t * dx, seg.y1 + t * dy);

      if (d < radio) {
        const peso = 1.0 / (d + 1);
        sumPeso += peso;
        sumSin  += sin(seg.angulo) * peso;
        sumCos  += cos(seg.angulo) * peso;
      }
    }

    if (sumPeso === 0) return radians(CONFIG.ESPINAS.ANGULO_BASE);
    return atan2(sumSin / sumPeso, sumCos / sumPeso);
  }

  debug() {
    noFill();
    for (const r of this.raices) r.debug();
    noStroke();
  }
}
