// Nodo.js — Punto de confluencia/separación de trazos
// API audio-ready: activar(), intensidad, pulso

class Nodo {
  constructor(x, y) {
    this.pos   = createVector(x, y);
    this.radio = random(CFG.NODO.RADIO_MIN, CFG.NODO.RADIO_MAX);

    this.pulso      = 0;
    this.intensidad = random(0.5, 1.0);
  }

  activar(fuerza = 1) {
    this.pulso = min(1, this.pulso + fuerza);
  }

  actualizar() {
    this.pulso *= CFG.NODO.DECAY;
  }

  dibujar() {
    push();
    noStroke();

    if (this.pulso > 0.03) {
      fill(255, 255, 200, this.pulso * 55);
      ellipse(this.pos.x, this.pos.y, this.radio * 4 + this.pulso * 18);
    }

    fill(255, 255, 210, 70 + this.pulso * 130);
    ellipse(this.pos.x, this.pos.y, this.radio * this.intensidad);

    pop();
  }
}
