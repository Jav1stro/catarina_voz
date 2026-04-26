// trazo.js — Hito 4: Comportamiento de Pastiche

class Trazo {
  constructor(x, y, colorID) {
    this.x        = x;
    this.y        = y;
    this.colorID  = colorID;
    this.pincelID = floor(random(PINCELES_TINTADOS.length));

    // Offsets únicos en el espacio de ruido
    this.nx = random(10000);
    this.ny = random(10000);
    this.nt = random(10000);

    this.angulo      = radians(CONFIG.ESPINAS.ANGULO_BASE);
    this.escala      = random(0.5, 1.0);
    this.vida        = 0;
    this.vidaMax     = floor(random(CONFIG.MOVIMIENTO.VIDA_MIN, CONFIG.MOVIMIENTO.VIDA_MAX));
    this.muerto      = false;
    this._frameStamp = 0;
    this.alpha       = 255; // decae al cruzar zonas de distinto colorID (mezcla/ensuciado)
  }

  update() {
    if (this.muerto) return;

    // La espina marca la dirección base; el Perlin agrega variación orgánica sobre ella
    const anguloEspina = espinaManager.getFuerza(this.x, this.y);
    const noiseVal     = noise(
      this.nx + this.x * CONFIG.MOVIMIENTO.ESCALA_RUIDO,
      this.ny + this.y * CONFIG.MOVIMIENTO.ESCALA_RUIDO,
      this.nt
    );
    const variacion    = radians(CONFIG.ESPINAS.VARIACION_ANGULO);
    const ruido        = map(noiseVal, 0, 1, -variacion, variacion);
    // BLEND_FUERZA=1 → sigue la espina pura · 0 → máxima variación de ruido
    this.angulo = anguloEspina + ruido * (1 - CONFIG.ESPINAS.BLEND_FUERZA);

    // Resistencia: jitter angular en celdas de alta densidad
    const den = grid.getDensidad(this.x, this.y);
    if (den >= CONFIG.PASTICHE.DENSIDAD_UMBRAL_RESIST) {
      this.angulo += radians(random(-CONFIG.PASTICHE.JITTER_MAX, CONFIG.PASTICHE.JITTER_MAX));
    }

    // Mover
    const vel = CONFIG.MOVIMIENTO.VELOCIDAD_BASE;
    this.x += cos(this.angulo) * vel;
    this.y += sin(this.angulo) * vel;
    this.nt += CONFIG.MOVIMIENTO.PASO_TIEMPO;

    // Estampar a intervalos
    this._frameStamp++;
    if (this._frameStamp >= CONFIG.MOVIMIENTO.INTERVALO_STAMP) {
      this._estampar();
      this._frameStamp = 0;
    }

    // Muerte por tiempo o por salir del canvas
    this.vida++;
    if (this.vida >= this.vidaMax ||
        this.x < 0 || this.x > width ||
        this.y < 0 || this.y > height) {
      this.muerto = true;
    }
  }

  _estampar() {
    const cidActual = grid.getColorID(this.x, this.y);
    const denActual = grid.getDensidad(this.x, this.y);

    // Mezcla/Ensuciado: al estampar sobre zona de distinto colorID, alpha↓
    if (cidActual >= 0 && cidActual !== this.colorID) {
      this.alpha *= CONFIG.PASTICHE.ALPHA_DECAY_MEZCLA;
      if (this.alpha < CONFIG.PASTICHE.ALPHA_MIN) {
        this.muerto = true;
        return;
      }
    }

    // Empaste: escala extra en zonas de alta densidad
    let escalaFinal = this.escala;
    if (denActual >= CONFIG.PASTICHE.DENSIDAD_UMBRAL_EMPASTE) {
      escalaFinal += CONFIG.PASTICHE.EMPASTE_ESCALA_EXTRA;
    }

    const img = PINCELES_TINTADOS[this.pincelID][this.colorID];
    const w   = img.width  * escalaFinal;
    const h   = img.height * escalaFinal;

    push();
    translate(this.x, this.y);
    // El PNG es horizontal; rotamos para alinear el eje largo con la dirección de avance
    rotate(this.angulo);
    imageMode(CENTER);
    // drawingContext.globalAlpha aplica opacidad sin tocar la colorización pre-renderizada
    drawingContext.save();
    drawingContext.globalAlpha = this.alpha / 255;
    image(img, 0, 0, w, h);
    drawingContext.restore();
    pop();

    grid.registrar(this.x, this.y, this.colorID);
  }
}
