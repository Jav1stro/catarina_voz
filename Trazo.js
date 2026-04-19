// Trazo.js — Paso 2: path noise-driven, grosor con noise × envolvente, grosorMult por capa

class Trazo {
  constructor(ox, oy, colorTrazo, grosorMult = 1) {
    this.color     = colorTrazo;
    this.grosorBase = random(1.5, 7) * grosorMult;
    this.largo      = random(height * 0.22, height * 0.68);

    // Seeds de noise únicos por instancia
    this.nDesvio = random(10000); // desvío lateral del path
    this.nOffset = random(10000); // variación de grosor
    this.nFreq   = random(2, 6);  // frecuencia de la variación de grosor

    this.pts     = this._generarPuntos(ox, oy);
    this.muestras = 110;
    this.alfa    = random(130, 225);
  }

  _generarPuntos(ox, oy) {
    let pts = [];
    let x = ox;
    let y = oy;
    let numCtrl = floor(random(4, 9));
    let paso = this.largo / numCtrl;

    pts.push(createVector(x, y));

    for (let i = 1; i <= numCtrl; i++) {
      // Noise mapeado a [-1, 1] para desvío orgánico y continuo
      let nVal  = noise(i * 0.55 + this.nDesvio);
      let desvio = map(nVal, 0, 1, -1, 1) * width * 0.2 * (i / numCtrl);
      x += desvio;

      // Ascenso con variación leve
      y -= paso * random(0.65, 1.35);
      x  = constrain(x, width * 0.04, width * 0.96);

      pts.push(createVector(x, y));
    }

    return pts;
  }

  _evaluar(t) {
    let n = this.pts.length - 1;
    let seg    = constrain(floor(t * n), 0, n - 1);
    let localT = t * n - seg;

    let i0 = max(0, seg - 1);
    let i1 = seg;
    let i2 = min(n, seg + 1);
    let i3 = min(n, seg + 2);

    let x = curvePoint(
      this.pts[i0].x, this.pts[i1].x,
      this.pts[i2].x, this.pts[i3].x, localT
    );
    let y = curvePoint(
      this.pts[i0].y, this.pts[i1].y,
      this.pts[i2].y, this.pts[i3].y, localT
    );

    return createVector(x, y);
  }

  dibujar() {
    let prev = null;

    for (let i = 0; i <= this.muestras; i++) {
      let t  = i / this.muestras;
      let pt = this._evaluar(t);

      // Noise orgánico × envolvente sinusoidal: extremos siempre finos,
      // cuerpo con variación irregular que imita la presión real del pincel
      let presionNoise = noise(t * this.nFreq + this.nOffset); // 0..1
      let envolvente   = sin(t * PI);                          // 0→1→0
      let grosor = this.grosorBase * presionNoise * 1.9 * envolvente;
      grosor = max(0.2, grosor);

      strokeWeight(grosor);
      stroke(red(this.color), green(this.color), blue(this.color), this.alfa);

      if (prev) line(prev.x, prev.y, pt.x, pt.y);
      prev = pt;
    }
  }
}
