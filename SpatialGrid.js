// SpatialGrid.js — Grilla espacial de presencia de trazos.
// Divide el lienzo en celdas. Cada celda recuerda qué segmentos de trazo la ocupan.
// Permite detectar colisiones en O(1) por celda en lugar de O(n²).
//
// Uso:
//   grid.registrar(x, y, nodoIdx, trazo)   → marca que el trazo pasó por (x,y)
//   grid.consultar(x, y, radio, nodoIdx)   → retorna entradas de otros nodos cerca de (x,y)
//   grid.limpiar()                         → vacía la grilla (al generar nueva composición)

class SpatialGrid {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.celdas   = {}; // mapa "col,row" → array de { nodoIdx, trazo, x, y }
  }

  // Convierte coordenada de mundo a índice de celda
  _clave(x, y) {
    return `${floor(x / this.cellSize)},${floor(y / this.cellSize)}`;
  }

  // Registra que un trazo de cierto nodo pasó por el punto (x, y)
  registrar(x, y, nodoIdx, trazo) {
    let clave = this._clave(x, y);
    if (!this.celdas[clave]) this.celdas[clave] = [];
    this.celdas[clave].push({ nodoIdx, trazo, x, y });
  }

  // Devuelve todas las entradas dentro del radio dado, excluyendo el propio nodo.
  // radio se redondea al tamaño de celda — la precisión exacta la hace el llamador.
  consultar(x, y, radio, nodoIdxPropio) {
    let resultado = [];
    let r   = ceil(radio / this.cellSize);
    let col = floor(x / this.cellSize);
    let row = floor(y / this.cellSize);

    for (let dc = -r; dc <= r; dc++) {
      for (let dr = -r; dr <= r; dr++) {
        let clave = `${col + dc},${row + dr}`;
        let bucket = this.celdas[clave];
        if (!bucket) continue;
        for (let entrada of bucket) {
          if (entrada.nodoIdx !== nodoIdxPropio) resultado.push(entrada);
        }
      }
    }
    return resultado;
  }

  limpiar() {
    this.celdas = {};
  }
}
