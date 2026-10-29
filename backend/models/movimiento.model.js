class Movimiento {
  constructor(id, tipo, categoria, concepto, monto, fecha) {
    this.id = id;
    this.tipo = tipo;
    this.categoria = categoria;
    this.concepto = concepto;
    this.monto = monto;
    this.fecha = fecha;
  }
}

module.exports = Movimiento;
