// Compras y proveedores (Manifiestos de Carga)
const conexion = require('../config/db');

function obtenerProveedores(callback) {
  conexion.query('SELECT * FROM proveedor', callback);
}

function crearProveedor(proveedor, callback) {
  const sql = 'INSERT INTO proveedor (nombre, telefono, correo) VALUES (?, ?, ?)';
  conexion.query(sql, [proveedor.nombre, proveedor.telefono, proveedor.correo], callback);
}

function actualizarProveedor(id, proveedor, callback) {
  const sql = 'UPDATE proveedor SET nombre = ?, telefono = ?, correo = ? WHERE id_proveedor = ?';
  conexion.query(sql, [proveedor.nombre, proveedor.telefono, proveedor.correo, id], callback);
}

function eliminarProveedor(id, callback) {
  conexion.query('DELETE FROM proveedor WHERE id_proveedor = ?', [id], callback);
}

function obtenerCompras(callback) {
  const sql = 'SELECT c.*, p.nombre AS proveedor FROM compra c JOIN proveedor p ON p.id_proveedor = c.id_proveedor ORDER BY c.id_compra DESC';
  conexion.query(sql, callback);
}

function crearCompra(compra, callback) {
  if (!compra.idProveedor || !compra.productos || compra.productos.length === 0) {
    callback({ estado: 400, message: 'El manifiesto necesita proveedor y productos' });
    return;
  }
  let total = 0;
  for (const producto of compra.productos) {
    total = total + producto.cantidad * producto.costoUnitario;
  }

  const sql = 'INSERT INTO compra (id_proveedor, fecha, total, estado, pago) VALUES (?, CURDATE(), ?, ?, ?)';
  conexion.query(sql, [compra.idProveedor, total, 'en transito', 'pendiente'], (error, resultado) => {
    if (error) {
      callback(error);
      return;
    }
    const idCompra = resultado.insertId;

    for (const producto of compra.productos) {
      conexion.query(
        'INSERT INTO detalle_compra (id_compra, id_producto, cantidad, costo_unitario) VALUES (?, ?, ?, ?)',
        [idCompra, producto.idProducto, producto.cantidad, producto.costoUnitario]
      );
    }

    callback(null, { id: idCompra, total: total });
  });
}

// Recepcion del manifiesto: suma los productos al inventario
function recibirCompra(id, callback) {
  conexion.query('SELECT d.* FROM detalle_compra d JOIN compra c ON c.id_compra = d.id_compra WHERE d.id_compra = ? AND c.estado <> ?', [id, 'recibido'], (error, detalles) => {
    if (error) {
      callback(error);
      return;
    }
    if (detalles.length === 0) {
      callback({ estado: 400, message: 'El manifiesto ya fue recibido o no tiene productos' });
      return;
    }

    for (const detalle of detalles) {
      conexion.query(
        'UPDATE producto SET existencia = existencia + ? WHERE id_producto = ?',
        [detalle.cantidad, detalle.id_producto]
      );
    }

    conexion.query('UPDATE compra SET estado = ? WHERE id_compra = ?', ['recibido', id], callback);
  });
}

// Al pagar el manifiesto se registra el egreso en Finanzas
function cambiarEstadoPago(id, estado, callback) {
  conexion.query('UPDATE compra SET pago = ? WHERE id_compra = ?', [estado, id], (error) => {
    if (error) {
      callback(error);
      return;
    }
    if (estado !== 'pagado') {
      callback(null);
      return;
    }
    const sql = 'INSERT INTO movimiento (tipo, categoria, concepto, monto, fecha) SELECT ?, ?, CONCAT(?, id_compra), total, CURDATE() FROM compra WHERE id_compra = ?';
    conexion.query(sql, ['egreso', 'compras', 'Pago manifiesto MC-', id], callback);
  });
}

function obtenerDetalleCompra(id, callback) {
  const sql = 'SELECT p.nombre, d.cantidad, d.costo_unitario FROM detalle_compra d JOIN producto p ON p.id_producto = d.id_producto WHERE d.id_compra = ?';
  conexion.query(sql, [id], callback);
}

module.exports = {
  obtenerProveedores,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
  obtenerCompras,
  obtenerDetalleCompra,
  crearCompra,
  recibirCompra,
  cambiarEstadoPago
};
