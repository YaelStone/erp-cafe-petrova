class Venta {
  constructor(id, idEmpleado, idCliente, total, formaPago) {
    this.id = id;
    this.idEmpleado = idEmpleado;
    this.idCliente = idCliente;
    this.total = total;
    this.formaPago = formaPago;
  }
}

module.exports = Venta;
