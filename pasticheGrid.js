// pasticheGrid.js — Hito 1

class PasticheGrid {
  constructor() {
    const tam  = CONFIG.GRILLA.TAMANO_CELDA;
    this.cols  = ceil(CONFIG.CANVAS.ANCHO / tam);
    this.rows  = ceil(CONFIG.CANVAS.ALTO  / tam);
    this.tam   = tam;

    // colorID: último color que pasó por la celda (-1 = vacío)
    this.colorID  = new Int8Array(this.cols * this.rows).fill(-1);
    // densidad: cuántas estampas acumuladas en la celda
    this.densidad = new Uint16Array(this.cols * this.rows);
  }

  // Convierte coordenadas de canvas a índice de celda
  _idx(x, y) {
    const col = constrain(floor(x / this.tam), 0, this.cols - 1);
    const row = constrain(floor(y / this.tam), 0, this.rows - 1);
    return row * this.cols + col;
  }

  registrar(x, y, colorID) {
    const i = this._idx(x, y);
    this.colorID[i]  = colorID;
    this.densidad[i] = min(this.densidad[i] + 1, CONFIG.GRILLA.DENSIDAD_MAX);
  }

  getDensidad(x, y) {
    return this.densidad[this._idx(x, y)];
  }

  getColorID(x, y) {
    return this.colorID[this._idx(x, y)];
  }

  reset() {
    this.colorID.fill(-1);
    this.densidad.fill(0);
  }

  // Overlay de debug: muestra densidad y colorID de cada celda ocupada
  debug() {
    const tam     = this.tam;
    const densMax = CONFIG.GRILLA.DENSIDAD_MAX;

    noStroke();
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const i   = r * this.cols + c;
        const den = this.densidad[i];
        if (den === 0) continue;

        const cid = this.colorID[i];
        const col = cid >= 0 ? CONFIG.PALETA[cid] : { r: 128, g: 128, b: 128 };
        const alfa = map(den, 0, densMax, 30, 160);

        fill(col.r, col.g, col.b, alfa);
        rect(c * tam, r * tam, tam, tam);
      }
    }

    // Borde de grilla en modo debug (muy sutil)
    stroke(255, 255, 255, 12);
    strokeWeight(0.5);
    noFill();
    for (let c = 0; c <= this.cols; c++) line(c * tam, 0, c * tam, height);
    for (let r = 0; r <= this.rows; r++) line(0, r * tam, width, r * tam);
    noStroke();
  }
}
