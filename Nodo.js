// Nodo.js — Punto de confluencia/separación de trazos
// API audio-ready: activar(), intensidad, pulso

class Nodo {
  constructor(x, y) {
    this.pos   = createVector(x, y);
    this.radio = random(4, 11);

    // ── Audio-ready ──────────────────────────────────────────
    // pulso:      0→1 — excitación momentánea (mapea a amplitud del mic)
    // intensidad: 0→1 — peso estructural del nodo (mapea a energía sostenida)
    this.pulso      = 0;
    this.intensidad = random(0.5, 1.0);
  }

  // Llamar desde AudioManager en Paso 3 (palmas, onset)
  activar(fuerza = 1) {
    this.pulso = min(1, this.pulso + fuerza);
  }

  actualizar() {
    this.pulso *= 0.88;
  }

  dibujar() {
    push();
    noStroke();

    // Halo de pulso: sólo visible cuando el nodo está activo
    if (this.pulso > 0.03) {
      fill(255, 255, 200, this.pulso * 55);
      ellipse(this.pos.x, this.pos.y, this.radio * 4 + this.pulso * 18);
    }

    // Punto central: muy sutil, apenas un acento
    fill(255, 255, 210, 70 + this.pulso * 130);
    ellipse(this.pos.x, this.pos.y, this.radio * this.intensidad);

    pop();
  }
}
