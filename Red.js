// Red.js — Nodos emergentes del árbol, cada uno emite trazos libres.
// No hay conexiones entre nodos: los trazos solo se separan desde su origen.
// Post-proceso: densidad espacial → fase y ondas de grosor (pastiche).
// API audio-ready: agregarNodo(), activarNodo(), ajustarIntensidad()

class Red {
  constructor() {
    this.nodos               = [];
    this.libres              = [];
    this._tiempoEmerg        = [];
    this._ramaDeNodo         = [];
    this._tEnRama            = [];
    this._angNodo            = [];
    this._muestraRegistrada  = []; // última muestra registrada en la grilla por cada libre
    this._intensidad         = 1.0;
    this.grid                = new SpatialGrid(CFG.RED.GRID_CELL_SIZE);
  }

  // ── Generación ─────────────────────────────────────────────────

  generar(espina) {
    this.nodos               = [];
    this.libres              = [];
    this._tiempoEmerg        = [];
    this._ramaDeNodo         = [];
    this._tEnRama            = [];
    this._angNodo            = [];
    this._muestraRegistrada  = [];
    this.grid.limpiar();

    // Nodos sobre las ramas del árbol
    let numArbol   = floor(random(CFG.RED.NODOS_ARBOL_MIN, CFG.RED.NODOS_ARBOL_MAX));
    let posiciones = espina.obtenerPosicionesNodos(numArbol);

    for (let p of posiciones) {
      this.nodos.push(new Nodo(p.pos.x, p.pos.y));
      this._ramaDeNodo.push(p.rama);
      this._tEnRama.push(p.t);
      let tan = p.rama.tangente(p.t);
      this._angNodo.push(atan2(tan.y, tan.x));
    }

    // Nodos flotantes — circle packing: se ubican en zonas sin nodos previos
    let numExtra = floor(random(CFG.RED.NODOS_EXTRA_MIN, CFG.RED.NODOS_EXTRA_MAX));
    this._generarNodosExtra(numExtra);

    this._generarTrazosLibres();
    this._generarTrazosCobertura(); // rellena zonas vacías del lienzo
    this._asignarTiempos(espina, numArbol);
    this._calcularOscilaciones();
  }

  // ── API audio-ready ────────────────────────────────────────────

  agregarNodo(x, y) {
    let idx = this.nodos.length;
    this.nodos.push(new Nodo(x, y));
    this._tiempoEmerg.push(0);
    this._angNodo.push(null);
    this._generarLibresNodo(idx);
    return idx;
  }

  activarNodo(idx, fuerza = 1) {
    if (idx >= 0 && idx < this.nodos.length) this.nodos[idx].activar(fuerza);
  }

  ajustarIntensidad(v) {
    this._intensidad = constrain(v, 0.1, 3.0);
  }

  // ── Loop ───────────────────────────────────────────────────────

  actualizar(frame) {
    for (let n of this.nodos)  n.actualizar();
    for (let l of this.libres) l.trazo.actualizar(frame);
    this._registrarEnGrilla();
    this._detectarColisiones();
  }

  dibujar() {
    noFill();
    for (let l of this.libres) l.trazo.dibujar();
    for (let n of this.nodos)  n.dibujar();
  }

  terminado() {
    if (this.libres.length === 0) return false;
    return this.libres.every(l => l.trazo.progreso >= 1 || l.trazo.colisionado);
  }

  progresoPromedio() {
    if (this.libres.length === 0) return 0;
    return this.libres.reduce((acc, l) => acc + l.trazo.progreso, 0) / this.libres.length;
  }

  // ── Internos ───────────────────────────────────────────────────

  // Circle packing: acepta posiciones que no solapan con ningún nodo existente
  _generarNodosExtra(n) {
    let radio = CFG.PASTICHE.RADIO_NODO;
    let intentosMax = CFG.PASTICHE.INTENTOS_NODO;

    for (let i = 0; i < n; i++) {
      let colocado = false;
      for (let intento = 0; intento < intentosMax; intento++) {
        let x = random(ANCHO * 0.05, ANCHO * 0.95);
        let y = random(ALTO  * 0.05, ALTO  * 0.95);
        let solapado = this.nodos.some(nd => nd.pos.dist(createVector(x, y)) < radio);
        if (!solapado) {
          this.nodos.push(new Nodo(x, y));
          this._ramaDeNodo.push(null);
          this._tEnRama.push(0);
          this._angNodo.push(null);
          colocado = true;
          break;
        }
      }
      // Si no encontró posición libre tras todos los intentos, lo omite
      if (!colocado) break;
    }
  }

  // Grilla de cobertura: detecta celdas vacías y distribuye trazos orgánicamente
  // entre múltiples nodos ponderados por proximidad — no un solo nodo por celda.
  _generarTrazosCobertura() {
    let P  = CFG.PASTICHE;
    let cw = ANCHO / P.GRID_COLS;
    let ch = ALTO  / P.GRID_ROWS;
    let radioCobertura = max(cw, ch);

    let midpoints = this.libres.map(l => l.trazo._evaluar(0.5));

    for (let ci = 0; ci < P.GRID_COLS; ci++) {
      for (let ri = 0; ri < P.GRID_ROWS; ri++) {
        let cx = (ci + 0.5) * cw;
        let cy = (ri + 0.5) * ch;
        let celda = createVector(cx, cy);

        let cubierta = midpoints.some(mp => mp.dist(celda) < radioCobertura);
        if (cubierta) continue;

        // Candidatos: todos los nodos, pesados por cercanía
        // Los nodos del árbol tienen el doble de peso (son la fuente principal)
        let candidatos = this.nodos.map((nd, i) => {
          let d    = nd.pos.dist(celda);
          let peso = (1 / max(1, d)) * (this._ramaDeNodo[i] !== null ? 2 : 1);
          return { i, peso };
        });
        let pesoTotal = candidatos.reduce((acc, c) => acc + c.peso, 0);

        // Cada trazo de cobertura se asigna a un nodo distinto por selección ponderada
        for (let t = 0; t < P.TRAZOS_POR_ZONA_VACIA; t++) {
          // Selección ponderada — ruleta de pesos
          let r = random(pesoTotal);
          let acum = 0;
          let nodoIdx = candidatos[candidatos.length - 1].i;
          for (let c of candidatos) {
            acum += c.peso;
            if (r <= acum) { nodoIdx = c.i; break; }
          }

          let angBase = atan2(cy - this.nodos[nodoIdx].pos.y, cx - this.nodos[nodoIdx].pos.x);
          let capa = CAPAS[floor(random(CAPAS.length))];
          let col  = PALETA[capa.idx[floor(random(capa.idx.length))]];
          let tr   = new Trazo(this.nodos[nodoIdx], col, capa.gMult,
                               angBase + random(-P.SPREAD_ZONA, P.SPREAD_ZONA));
          tr.alfa  = random(capa.alfaMin, capa.alfaMax);
          this.libres.push({ nodoIdx, trazo: tr });
          midpoints.push(tr._evaluar(0.5));
        }
      }
    }
  }

  _generarTrazosLibres() {
    for (let i = 0; i < this.nodos.length; i++) this._generarLibresNodo(i);
  }

  _generarLibresNodo(i) {
    let num = floor(random(CFG.RED.LIBRES_MIN, CFG.RED.LIBRES_MAX));
    let ang = this._angNodo[i];

    // Destino compartido del grupo: todos los trazos del nodo apuntan a la misma distancia base.
    // El líder (t=0) llega completo; los demás se desvanecen antes según FRACCION_MIN.
    let targetLargo = random(height * CFG.TRAZO.LARGO_MIN, height * CFG.TRAZO.LARGO_MAX);

    for (let t = 0; t < num; t++) {
      let capa    = CAPAS[floor(random(CAPAS.length))];
      let col     = PALETA[capa.idx[floor(random(capa.idx.length))]];
      let fraccion = (t === 0) ? 1.0 : random(CFG.RED.FRACCION_MIN, 0.92);
      let tr      = new Trazo(this.nodos[i], col, capa.gMult, ang, targetLargo * fraccion);
      tr.alfa     = random(capa.alfaMin, capa.alfaMax) * (0.5 + 0.5 * fraccion);
      this.libres.push({ nodoIdx: i, trazo: tr });
    }
  }

  // Timing: nodos del árbol nacen cuando la punta de su rama llega a su t.
  //         nodos flotantes emergen escalonados después de que el árbol termina.
  _asignarTiempos(espina, numNodosArbol) {
    let finArbol = espina.duracion + espina.retraso;

    for (let i = 0; i < numNodosArbol; i++) {
      let rama = this._ramaDeNodo[i];
      let t    = this._tEnRama[i];
      this._tiempoEmerg[i] = rama
        ? rama.frameEnT(t) + floor(random(CFG.RED.NODO_JITTER_MIN, CFG.RED.NODO_JITTER_MAX))
        : floor(random(0, finArbol));
    }

    let maxEmergArbol = 0;
    for (let i = 0; i < numNodosArbol; i++) {
      maxEmergArbol = max(maxEmergArbol, this._tiempoEmerg[i]);
    }
    let inicioFlotantes = max(finArbol, maxEmergArbol) + 20;

    for (let i = numNodosArbol; i < this.nodos.length; i++) {
      let orden = i - numNodosArbol;
      this._tiempoEmerg[i] = inicioFlotantes + floor(orden * 18 + random(0, 12));
    }

    for (let l of this.libres) {
      let tNodo        = this._tiempoEmerg[l.nodoIdx];
      l.trazo.retraso  = tNodo + floor(random(4, 18));
      l.trazo.duracion = l.trazo.duracionBase; // largo × DURACION_FACTOR = misma vel. que espina
      l.trazo.progreso = 0;
    }
  }

  // Registra en la grilla los puntos nuevos de cada trazo (solo los aún no registrados).
  // Se llama cada frame para mantener la grilla actualizada sin re-registrar todo.
  _registrarEnGrilla() {
    for (let i = 0; i < this.libres.length; i++) {
      let l = this.libres[i];
      if (l.trazo.progreso <= 0) continue;

      let limite = floor(l.trazo.progreso * l.trazo.muestras);
      let desde  = this._muestraRegistrada[i] ?? 0;

      for (let k = desde; k <= limite; k += 2) {
        let pt = l.trazo._evaluar(k / l.trazo.muestras);
        this.grid.registrar(pt.x, pt.y, l.nodoIdx, l.trazo);
      }

      this._muestraRegistrada[i] = limite + 1;
    }
  }

  // Colisión via grilla: consulta O(1) por celda en lugar de O(n²m).
  // La punta del trazo activo busca entradas de otros nodos en su radio.
  _detectarColisiones() {
    let radio = CFG.RED.COLISION_RADIO;

    for (let i = 0; i < this.libres.length; i++) {
      let li = this.libres[i];
      let ti = li.trazo;
      if (ti.colisionado || ti.progreso < 0.15 || ti.progreso >= 1) continue;

      let punta   = ti._evaluar(ti.progreso);
      let vecinos = this.grid.consultar(punta.x, punta.y, radio, li.nodoIdx);

      if (vecinos.length > 0) {
        // Verificación de distancia exacta contra los puntos devueltos por la grilla
        for (let v of vecinos) {
          if (punta.dist(createVector(v.x, v.y)) < radio) {
            ti.colisionado    = true;
            ti.puntoColision  = punta.copy(); // guardado para el Paso 3 (efecto visual)
            break;
          }
        }
      }
    }
  }

  // Asigna fase espacial y ondas a cada trazo según densidad local.
  // Trazos cercanos comparten fase → sus grosores se expanden y contraen en sintonía.
  _calcularOscilaciones() {
    let D = CFG.DENSIDAD;
    let midpoints = this.libres.map(l => l.trazo._evaluar(0.5));

    for (let i = 0; i < this.libres.length; i++) {
      let count = 0;
      for (let j = 0; j < midpoints.length; j++) {
        if (i !== j && midpoints[i].dist(midpoints[j]) < D.RADIO) count++;
      }
      let densidad = count / max(1, this.libres.length - 1);

      // Fase derivada de la posición espacial: trazos cercanos → ondas en fase
      let mid = midpoints[i];
      this.libres[i].trazo.fase  = (mid.x * 0.018 + mid.y * 0.012) % TWO_PI;

      // Más denso → más oscilaciones (efecto de competencia entre trazos)
      this.libres[i].trazo.ondas = lerp(
        CFG.TRAZO.ONDA_MIN, CFG.TRAZO.ONDA_MAX,
        constrain(densidad / D.UMBRAL, 0, 1)
      );

      // Grosor ajustado por densidad: zonas vacías → trazos más gruesos
      if (this.libres[i].trazo.grosorBase >= D.ACCENT_UMBRAL) {
        let factor = map(densidad, 0, D.UMBRAL, D.FACTOR_SPARSE, D.FACTOR_DENSE, true);
        this.libres[i].trazo.grosorBase = constrain(
          this.libres[i].trazo.grosorBase * factor, 1, D.GROSOR_MAX
        );
      }

      // Alpha inversamente proporcional al grosor final:
      // trazos gruesos → más transparentes → dejan ver el pastiche debajo
      let alfaFactor = map(
        this.libres[i].trazo.grosorBase,
        1, D.GROSOR_MAX,
        CFG.TRAZO.ALFA_GROSOR_FACTOR_MAX, CFG.TRAZO.ALFA_GROSOR_FACTOR_MIN,
        true
      );
      this.libres[i].trazo.alfa = constrain(
        this.libres[i].trazo.alfa * alfaFactor, 15, 255
      );
    }
  }
}
