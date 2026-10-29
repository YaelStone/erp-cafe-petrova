class Compra {
  constructor(id, idProveedor, fecha, total, estado) {
    this.id = id;
    this.idProveedor = idProveedor;
    this.fecha = fecha;
    this.total = total;
    this.estado = estado;
  }
}

module.exports = Compra;
