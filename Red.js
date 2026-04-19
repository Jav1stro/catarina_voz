// Red.js — Grafo orgánico: nodos emergentes de la espina, conexiones y continuaciones.
// Regla: máx. 3 trazos por nodo (conexiones), ~35% truncados (fraccionFin < 1).
// Post-proceso: grosor ajustado por densidad espacial local.
// API audio-ready: agregarNodo(), activarNodo(), ajustarIntensidad()

class Red {
  constructor() {
    this.nodos         = [];
    this.conexiones    = [];
    this.libres        = [];
    this._tiempoEmerg  = []; // frame en que cada nodo "nace" en la animación
    this._intensidad   = 1.0;
  }

  // ── Generación ─────────────────────────────────────────────

  generar(espina) {
    this.nodos      = [];
    this.conexiones = [];
    this.libres     = [];
    this._tiempoEmerg = [];

    // Nodos sobre la espina (con desvío lateral amplio)
    let numEspina  = floor(random(7, 12));
    let posiciones = espina.obtenerPosicionesNodos(numEspina);
    posiciones.sort((a, b) => b.y - a.y); // mayor Y = más abajo = nace antes
    for (let pos of posiciones) this.nodos.push(new Nodo(pos.x, pos.y));

    // Nodos flotantes adicionales: cubren zonas alejadas de la espina
    let numExtra = floor(random(4, 7));
    for (let i = 0; i < numExtra; i++) {
      this.nodos.push(new Nodo(
        random(ANCHO * 0.06, ANCHO * 0.94),
        random(ALTO  * 0.05, ALTO  * 0.95)
      ));
    }

    this._generarConexiones();
    this._generarTrazosLibres();
    this._asignarTiempos(espina, numEspina);
    this._generarContinuaciones();
    this._ajustarGrososPorDensidad();
  }

  // ── API audio-ready ────────────────────────────────────────

  // Paso 3 — palmas: nodo nuevo emergente desde una posición
  agregarNodo(x, y) {
    let n   = new Nodo(x, y);
    let idx = this.nodos.length;
    this.nodos.push(n);
    this._tiempoEmerg.push(0); // empieza de inmediato
    this._conectarNodoNuevo(idx);
    return idx;
  }

  // Paso 3 — beat / amplitud: pulso en un nodo
  activarNodo(idx, fuerza = 1) {
    if (idx >= 0 && idx < this.nodos.length) this.nodos[idx].activar(fuerza);
  }

  // Paso 3 — canto sostenido: peso global de trazos
  ajustarIntensidad(v) {
    this._intensidad = constrain(v, 0.1, 3.0);
  }

  // ── Loop ───────────────────────────────────────────────────

  actualizar(frame) {
    for (let n of this.nodos)      n.actualizar();
    for (let c of this.conexiones) for (let tr of c.trazos) tr.actualizar(frame);
    for (let l of this.libres)     l.trazo.actualizar(frame);
  }

  dibujar() {
    noFill();
    for (let c of this.conexiones) for (let tr of c.trazos) tr.dibujar();
    for (let l of this.libres)     l.trazo.dibujar();
    for (let n of this.nodos)      n.dibujar();
  }

  terminado() {
    if (this.conexiones.length === 0 && this.libres.length === 0) return false;
    return this.conexiones.every(c => c.trazos.every(tr => tr.progreso >= 1))
        && this.libres.every(l => l.trazo.progreso >= 1);
  }

  progresoPromedio() {
    let total = 0, cuenta = 0;
    for (let c of this.conexiones) for (let tr of c.trazos) { total += tr.progreso; cuenta++; }
    for (let l of this.libres) { total += l.trazo.progreso; cuenta++; }
    return cuenta > 0 ? total / cuenta : 0;
  }

  // ── Internos ───────────────────────────────────────────────

  _generarConexiones() {
    let dMax   = max(ANCHO, ALTO) * 0.92;
    const LIM  = 3; // máx. trazos de conexión por nodo para evitar acumulación
    let carga  = new Array(this.nodos.length).fill(0);

    for (let i = 0; i < this.nodos.length; i++) {
      let vecinos = [];
      for (let j = 0; j < this.nodos.length; j++) {
        if (i === j) continue;
        let d = this.nodos[i].pos.dist(this.nodos[j].pos);
        if (d < dMax) vecinos.push({ j, d });
      }
      vecinos.sort((a, b) => a.d - b.d);

      let k = floor(random(2, 5));

      for (let n = 0; n < min(k, vecinos.length); n++) {
        let j = vecinos[n].j;
        if (this._conexionExiste(i, j)) continue;
        if (carga[i] >= LIM || carga[j] >= LIM) continue;

        let numTr = min(floor(random(1, 4)), LIM - carga[i], LIM - carga[j]);
        if (numTr <= 0) continue;

        let trazos = this._crearTrazosConexion(i, j, numTr);
        this.conexiones.push({ a: i, b: j, trazos });
        carga[i] += numTr;
        carga[j] += numTr;
      }
    }
  }

  _crearTrazosConexion(i, j, num) {
    let out = [];
    for (let t = 0; t < num; t++) {
      let capa = CAPAS[floor(random(CAPAS.length))];
      let col  = PALETA[ capa.idx[ floor(random(capa.idx.length)) ] ];
      let tr   = new Trazo(this.nodos[i], this.nodos[j], col, capa.gMult);
      tr.alfa  = random(capa.alfaMin, capa.alfaMax);

      // ~35% de trazos truncados: terminan antes de llegar al nodo destino
      tr.fraccionFin = random() < 0.35 ? random(0.38, 0.80) : 1.0;

      out.push(tr);
    }
    return out;
  }

  _generarTrazosLibres() {
    // TODOS los nodos generan libres (no probabilístico) en distintas direcciones
    // para garantizar cobertura del lienzo → efecto pastiche pictórico
    for (let i = 0; i < this.nodos.length; i++) {
      let num = floor(random(3, 7)); // 3-6 libres por nodo
      for (let t = 0; t < num; t++) {
        let capa = CAPAS[floor(random(CAPAS.length))];
        let col  = PALETA[ capa.idx[ floor(random(capa.idx.length)) ] ];
        let tr   = new Trazo(this.nodos[i], null, col, capa.gMult);
        tr.alfa  = random(capa.alfaMin, capa.alfaMax);
        this.libres.push({ nodoIdx: i, trazo: tr });
      }
    }
  }

  // Timing: espina termina → nodos de la espina emergen uno por uno
  //         nodos flotantes emergen en paralelo en ventana aleatoria
  _asignarTiempos(espina, numNodosEspina) {
    let finEspina    = espina.duracion + espina.retraso;
    let delayPorNodo = 25; // más lento: 25 frames entre nodos consecutivos

    // Nodos de la espina: en orden de abajo a arriba
    for (let i = 0; i < numNodosEspina; i++) {
      this._tiempoEmerg[i] = finEspina + i * delayPorNodo + floor(random(-3, 5));
    }

    // Nodos flotantes: emergen en ventana aleatoria durante el período de la espina
    let ventana = (numNodosEspina - 1) * delayPorNodo;
    for (let i = numNodosEspina; i < this.nodos.length; i++) {
      this._tiempoEmerg[i] = finEspina + floor(random(0, ventana + 20));
    }

    // Conexiones: arrancan poco después de que emerge su nodo de origen
    for (let c of this.conexiones) {
      let tNodo = this._tiempoEmerg[c.a];
      c.trazos.forEach((tr, ti) => {
        tr.retraso  = tNodo + floor(ti * 8 + random(2, 14));
        tr.duracion = max(24, floor(tr.duracionBase * tr.fraccionFin));
        tr.progreso = 0;
      });
    }

    // Libres: arrancan desde el tiempo de emergencia del nodo origen
    this.libres.forEach((l) => {
      let tNodo      = this._tiempoEmerg[l.nodoIdx];
      l.trazo.retraso  = tNodo + floor(random(4, 18));
      l.trazo.duracion = l.trazo.duracionBase;
      l.trazo.progreso = 0;
    });
  }

  // Nodos con carga total > 5 emiten 1-3 trazos de continuación
  // que arrancan cuando el último trazo entrante termina
  _generarContinuaciones() {
    for (let i = 0; i < this.nodos.length; i++) {
      let carga = 0, maxFin = 0;

      for (let c of this.conexiones) {
        if (c.a === i || c.b === i) {
          carga += c.trazos.length;
          for (let tr of c.trazos) maxFin = max(maxFin, tr.retraso + tr.duracion);
        }
      }
      for (let l of this.libres) {
        if (l.nodoIdx === i) {
          carga++;
          maxFin = max(maxFin, l.trazo.retraso + l.trazo.duracion);
        }
      }

      if (carga <= 5) continue;

      let destino = this._encontrarDestinoContinuacion(i);
      if (destino === -1) continue;

      let numCont = floor(random(1, 4));
      let nuevos  = [];

      for (let t = 0; t < numCont; t++) {
        let capa = CAPAS[floor(random(CAPAS.length))];
        let col  = PALETA[ capa.idx[ floor(random(capa.idx.length)) ] ];
        let tr   = new Trazo(this.nodos[i], this.nodos[destino], col, capa.gMult);
        tr.alfa       = random(capa.alfaMin, capa.alfaMax);
        tr.fraccionFin = 1.0;
        tr.retraso    = maxFin + floor(t * 10 + random(8, 22));
        tr.duracion   = tr.duracionBase;
        tr.progreso   = 0;
        nuevos.push(tr);
      }

      this.conexiones.push({ a: i, b: destino, trazos: nuevos });
    }
  }

  // Ajusta grosorBase según densidad local: zonas vacías → trazos más anchos.
  // Los trazos finos (accent lines < 2.5px) se preservan sin modificar.
  _ajustarGrososPorDensidad() {
    let allTrazos = [];
    let midpoints = [];

    for (let c of this.conexiones) {
      for (let tr of c.trazos) {
        allTrazos.push(tr);
        midpoints.push(tr._evaluar(tr.fraccionFin * 0.5));
      }
    }
    for (let l of this.libres) {
      allTrazos.push(l.trazo);
      midpoints.push(l.trazo._evaluar(0.5));
    }

    let R = 145; // radio de influencia para medir densidad

    for (let i = 0; i < allTrazos.length; i++) {
      let count = 0;
      for (let j = 0; j < midpoints.length; j++) {
        if (i !== j && midpoints[i].dist(midpoints[j]) < R) count++;
      }

      let densidad = count / max(1, allTrazos.length - 1);
      let factor   = map(densidad, 0, 0.45, 2.4, 0.55, true);

      // Los accent lines (muy finos) no se escalan para preservar la variedad
      if (allTrazos[i].grosorBase >= 2.5) {
        allTrazos[i].grosorBase = constrain(allTrazos[i].grosorBase * factor, 1, 20);
      }
    }
  }

  // Prefiere nodos lejanos y no conectados (expande la pintura)
  _encontrarDestinoContinuacion(fromIdx) {
    let candidatos = [];
    for (let j = 0; j < this.nodos.length; j++) {
      if (j === fromIdx) continue;
      let d = this.nodos[fromIdx].pos.dist(this.nodos[j].pos);
      if (d > 100 && !this._conexionExiste(fromIdx, j)) candidatos.push({ j, d });
    }
    if (candidatos.length === 0) {
      for (let j = 0; j < this.nodos.length; j++) {
        if (j !== fromIdx) candidatos.push({ j, d: this.nodos[fromIdx].pos.dist(this.nodos[j].pos) });
      }
    }
    if (candidatos.length === 0) return -1;

    candidatos.sort((a, b) => b.d - a.d);
    let pool = candidatos.slice(0, max(1, floor(candidatos.length * 0.5)));
    return random(pool).j;
  }

  // Conecta un nodo nuevo (Paso 3: palmas)
  _conectarNodoNuevo(idx) {
    let dMax    = max(ANCHO, ALTO) * 0.9;
    let vecinos = [];
    for (let j = 0; j < idx; j++) {
      let d = this.nodos[idx].pos.dist(this.nodos[j].pos);
      if (d < dMax) vecinos.push({ j, d });
    }
    vecinos.sort((a, b) => a.d - b.d);

    for (let n = 0; n < min(2, vecinos.length); n++) {
      let j      = vecinos[n].j;
      let trazos = this._crearTrazosConexion(idx, j, floor(random(1, 3)));
      trazos.forEach((tr, ti) => {
        tr.retraso  = floor(ti * 10);
        tr.duracion = max(24, floor(tr.duracionBase * tr.fraccionFin));
      });
      this.conexiones.push({ a: idx, b: j, trazos });
    }

    if (random() < 0.5) {
      let capa = CAPAS[floor(random(CAPAS.length))];
      let col  = PALETA[ capa.idx[ floor(random(capa.idx.length)) ] ];
      let tr   = new Trazo(this.nodos[idx], null, col, capa.gMult);
      tr.alfa     = random(capa.alfaMin, capa.alfaMax);
      tr.duracion = tr.duracionBase;
      this.libres.push({ nodoIdx: idx, trazo: tr });
    }
  }

  _conexionExiste(i, j) {
    return this.conexiones.some(c => (c.a===i && c.b===j) || (c.a===j && c.b===i));
  }
}
