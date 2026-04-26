// fondo.js — Hito 3.5: Fondo Ambiente (acumulación tipo acuarela)

// ─── FONDO ORIGEN ─────────────────────────────────────────────────────────────
// Nace en un punto vacío y reclama territorio celda a celda.
// Cada frame deposita "dabs" muy transparentes sobre el área reclamada —
// la pintura se acumula gradualmente: el centro se enriquece, los bordes se difuminan.
class FondoOrigen {
  constructor(celdasOcupadas) {
    this.celdasOcupadas = celdasOcupadas;
    this.terminado      = false;

    const tam   = CONFIG.GRILLA.TAMANO_CELDA;
    this.tam    = tam;
    this.cols   = ceil(CONFIG.CANVAS.ANCHO / tam);
    this.rows   = ceil(CONFIG.CANVAS.ALTO  / tam);

    // Buscar celda de nacimiento vacía
    let startIdx = -1;
    for (let intento = 0; intento < 200; intento++) {
      const c   = floor(random(this.cols));
      const r   = floor(random(this.rows));
      const idx = r * this.cols + c;
      const cx  = c * tam + tam * 0.5;
      const cy  = r * tam + tam * 0.5;
      if (!celdasOcupadas.has(idx) && grid.getDensidad(cx, cy) === 0) {
        startIdx = idx;
        break;
      }
    }

    if (startIdx === -1) { this.terminado = true; return; }

    // Color único con variación amplia
    const col = CONFIG.FONDO.COLOR;
    const v   = random(-CONFIG.FONDO.VARIACION_COLOR, CONFIG.FONDO.VARIACION_COLOR);
    this.cr   = constrain(col.r + v,       0, 255);
    this.cg   = constrain(col.g + v * 0.8, 0, 255);
    this.cb   = constrain(col.b + v * 0.5, 0, 255);

    this.frontier    = [startIdx];
    this.celdasList  = [startIdx]; // todas las celdas reclamadas (para los dabs)
    this._frameCount = 0;

    celdasOcupadas.add(startIdx);
  }

  update() {
    if (this.terminado) return;

    // ── 1. Dabs de pintura sobre área reclamada (cada frame) ──────────────────
    this._dabble();

    // ── 2. Expansión territorial (cada N frames) ──────────────────────────────
    this._frameCount++;
    if (this._frameCount < CONFIG.FONDO.EXPANSION_INTERVALO) return;
    this._frameCount = 0;

    if (this.frontier.length === 0) { this.terminado = true; return; }

    const srcIdx = this._elegirFuente();
    const srcC   = srcIdx % this.cols;
    const srcR   = floor(srcIdx / this.cols);
    const vecina = this._elegirVecina(srcC, srcR);

    if (vecina) {
      this.celdasOcupadas.add(vecina.idx);
      this.frontier.push(vecina.idx);
      this.celdasList.push(vecina.idx);
    } else {
      const pos = this.frontier.indexOf(srcIdx);
      if (pos !== -1) this.frontier.splice(pos, 1);
    }
  }

  // Deposita dabs suaves sobre el área reclamada que no haya sido pintada por trazos
  _dabble() {
    if (this.celdasList.length === 0) return;
    const n    = min(CONFIG.FONDO.DABS_POR_FRAME, this.celdasList.length);
    const sz   = this.tam * CONFIG.FONDO.RADIO_DAB;

    noStroke();
    fill(this.cr, this.cg, this.cb, CONFIG.FONDO.ALPHA_DAB);

    for (let i = 0; i < n; i++) {
      const idx = this.celdasList[floor(random(this.celdasList.length))];
      const c   = idx % this.cols;
      const r   = floor(idx / this.cols);
      const cx  = c * this.tam + this.tam * 0.5;
      const cy  = r * this.tam + this.tam * 0.5;

      // No pintar sobre celdas que ya tienen trazos encima
      if (grid.getDensidad(cx, cy) > 0) continue;

      // Elipse con leve jitter de posición, tamaño y proporción
      const ox  = random(-this.tam * 0.4, this.tam * 0.4);
      const oy  = random(-this.tam * 0.4, this.tam * 0.4);
      const sw  = sz * random(0.7, 1.2);
      const sh  = sw * random(0.55, 1.0);
      const rot = random(TWO_PI);

      push();
      translate(cx + ox, cy + oy);
      rotate(rot);
      ellipse(0, 0, sw, sh);
      pop();
    }
  }

  // Elige la celda fuente de la frontera ponderada por el campo Perlin local
  _elegirFuente() {
    if (this.frontier.length === 1) return this.frontier[0];
    let total = 0;
    const pesos = this.frontier.map(idx => {
      const c  = idx % this.cols;
      const r  = floor(idx / this.cols);
      const cx = c * this.tam + this.tam * 0.5;
      const cy = r * this.tam + this.tam * 0.5;
      const p  = 0.2 + noise(cx * CONFIG.FONDO.ESCALA_RUIDO_FLUJO,
                              cy * CONFIG.FONDO.ESCALA_RUIDO_FLUJO) * 0.8;
      total += p;
      return p;
    });
    let rnd = random(total);
    for (let i = 0; i < this.frontier.length; i++) {
      rnd -= pesos[i];
      if (rnd <= 0) return this.frontier[i];
    }
    return this.frontier[this.frontier.length - 1];
  }

  // Elige vecina libre sesgada por alineación con el campo de flujo Perlin
  _elegirVecina(srcC, srcR) {
    const cx    = srcC * this.tam + this.tam * 0.5;
    const cy    = srcR * this.tam + this.tam * 0.5;
    const flujo = noise(cx * CONFIG.FONDO.ESCALA_RUIDO_FLUJO,
                        cy * CONFIG.FONDO.ESCALA_RUIDO_FLUJO) * TWO_PI;

    const dirs = [[0,-1],[1,0],[0,1],[-1,0],[1,-1],[1,1],[-1,1],[-1,-1]];
    const candidatas = [];

    for (const [dc, dr] of dirs) {
      const nc  = srcC + dc;
      const nr  = srcR + dr;
      if (nc < 0 || nc >= this.cols || nr < 0 || nr >= this.rows) continue;
      const nIdx = nr * this.cols + nc;
      const ncx  = nc * this.tam + this.tam * 0.5;
      const ncy  = nr * this.tam + this.tam * 0.5;
      if (this.celdasOcupadas.has(nIdx) ||
          grid.getDensidad(ncx, ncy) > CONFIG.FONDO.DENSIDAD_MUERTE) continue;

      const alin = cos(atan2(dr, dc) - flujo);
      candidatas.push({ idx: nIdx, peso: 0.05 + max(0, alin) });
    }

    if (candidatas.length === 0) return null;
    let total = candidatas.reduce((s, c) => s + c.peso, 0);
    let rnd   = random(total);
    for (const c of candidatas) {
      rnd -= c.peso;
      if (rnd <= 0) return c;
    }
    return candidatas[candidatas.length - 1];
  }
}

// ─── FONDO AMBIENTE ───────────────────────────────────────────────────────────
class FondoAmbiente {
  constructor() {
    this.celdasOcupadas = new Set();
    this.origenes       = [];
    this._iniciado      = false;
    this._tiempoInicio  = null;
  }

  update() {
    // Esperar el delay antes de arrancar
    if (!this._iniciado) {
      if (this._tiempoInicio === null) this._tiempoInicio = millis();
      if (millis() - this._tiempoInicio < CONFIG.FONDO.DELAY_INICIO) return;
      this._iniciado = true;
      this._poblar();
    }

    for (let i = this.origenes.length - 1; i >= 0; i--) {
      this.origenes[i].update();
      if (this.origenes[i].terminado) {
        this.origenes.splice(i, 1);
        const o = new FondoOrigen(this.celdasOcupadas);
        if (!o.terminado) this.origenes.push(o);
      }
    }
  }

  _poblar() {
    for (let i = 0; i < CONFIG.FONDO.ORIGENES_MAX; i++) {
      const o = new FondoOrigen(this.celdasOcupadas);
      if (!o.terminado) this.origenes.push(o);
    }
  }

  reset() {
    this.celdasOcupadas.clear();
    this.origenes      = [];
    this._iniciado     = false;
    this._tiempoInicio = null;
  }
}
