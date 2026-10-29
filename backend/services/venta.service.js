// Ventas (Bitacora de Mision)
const conexion = require('../config/db');

function obtenerVentas(callback) {
  const sql = 'SELECT v.*, e.nombre AS cajero, c.nombre AS cliente, c.correo AS correo_cliente FROM venta v JOIN empleado e ON e.id_empleado = v.id_empleado LEFT JOIN cliente c ON c.id_cliente = v.id_cliente ORDER BY v.id_venta DESC';
  conexion.query(sql, callback);
}

function obtenerVenta(id, callback) {
  const sql = 'SELECT p.codigo, p.nombre, d.cantidad, d.precio_unitario FROM detalle_venta d JOIN producto p ON p.id_producto = d.id_producto WHERE d.id_venta = ?';
  conexion.query(sql, [id], callback);
}

// Calcula el ticket con los precios de la base, no con los que manda el navegador
function calcularTotales(productos, callback) {
  if (!productos || productos.length === 0) {
    callback({ estado: 400, message: 'La venta no tiene productos' });
    return;
  }

  const ids = productos.map(p => p.idProducto);
  conexion.query('SELECT id_producto, nombre, precio, existencia FROM producto WHERE id_producto IN (?)', [ids], (error, filas) => {
    if (error) {
      callback(error);
      return;
    }

    let subtotal = 0;
    const lineas = [];
    for (const producto of productos) {
      const fila = filas.find(f => f.id_producto === Number(producto.idProducto));
      const cantidad = Number(producto.cantidad);
      if (!fila || !(cantidad > 0)) {
        callback({ estado: 400, message: 'Producto o cantidad no valida' });
        return;
      }
      if (cantidad > fila.existencia) {
        callback({ estado: 400, message: 'No hay suficiente ' + fila.nombre + ' (quedan ' + fila.existencia + ')' });
        return;
      }
      const precio = Number(fila.precio);
      subtotal = subtotal + cantidad * precio;
      lineas.push({ idProducto: fila.id_producto, cantidad: cantidad, precio: precio });
    }

    const iva = Math.round(subtotal * 0.16 * 100) / 100;
    const total = Math.round((subtotal + iva) * 100) / 100;
    callback(null, { lineas: lineas, subtotal: subtotal, iva: iva, total: total });
  });
}

// Guarda la venta, guarda su detalle y descuenta la existencia
function crearVenta(venta, callback) {
  calcularTotales(venta.productos, (error, cuenta) => {
    if (error) {
      callback(error);
      return;
    }

    const sql = 'INSERT INTO venta (id_empleado, id_cliente, fecha, subtotal, iva, total, forma_pago, id_pago_paypal) VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?)';
    const datos = [venta.idEmpleado, venta.idCliente || null, cuenta.subtotal, cuenta.iva, cuenta.total, venta.formaPago, venta.idPaypal || null];

    conexion.query(sql, datos, (error2, resultado) => {
      if (error2) {
        callback(error2);
        return;
      }
      const idVenta = resultado.insertId;

      for (const producto of cuenta.lineas) {
        conexion.query(
          'INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
          [idVenta, producto.idProducto, producto.cantidad, producto.precio]
        );
        conexion.query(
          'UPDATE producto SET existencia = existencia - ? WHERE id_producto = ?',
          [producto.cantidad, producto.idProducto]
        );
      }

      // La venta tambien se guarda como ingreso en el balance
      conexion.query(
        'INSERT INTO movimiento (tipo, categoria, concepto, monto, fecha) VALUES (?, ?, ?, ?, CURDATE())',
        ['ingreso', 'ventas', 'Venta numero ' + idVenta + ' (' + venta.formaPago + ')', cuenta.total]
      );

      // Programa Amaze: un punto por cada 10 pesos
      if (venta.idCliente) {
        conexion.query('UPDATE cliente SET puntos = puntos + ? WHERE id_cliente = ?', [Math.floor(cuenta.total / 10), venta.idCliente]);
      }

      callback(null, { id: idVenta, subtotal: cuenta.subtotal, iva: cuenta.iva, total: cuenta.total });
    });
  });
}

// Cancelar: regresa la existencia y borra el ingreso
function eliminarVenta(id, callback) {
  conexion.query('SELECT * FROM detalle_venta WHERE id_venta = ?', [id], (error, detalles) => {
    if (error) {
      callback(error);
      return;
    }
    for (const detalle of detalles) {
      conexion.query('UPDATE producto SET existencia = existencia + ? WHERE id_producto = ?', [detalle.cantidad, detalle.id_producto]);
    }
    conexion.query('DELETE FROM movimiento WHERE concepto LIKE ?', ['Venta numero ' + id + ' (%']);
    conexion.query('DELETE FROM detalle_venta WHERE id_venta = ?', [id], (error2) => {
      if (error2) {
        callback(error2);
        return;
      }
      conexion.query('DELETE FROM venta WHERE id_venta = ?', [id], callback);
    });
  });
}

// Corte de caja del dia
function obtenerCorte(idEmpleado, callback) {
  const sql = 'SELECT COUNT(*) AS tickets, COALESCE(SUM(total), 0) AS total_vendido FROM venta WHERE id_empleado = ? AND fecha = CURDATE()';
  conexion.query(sql, [idEmpleado], callback);
}

module.exports = { obtenerVentas, obtenerVenta, calcularTotales, crearVenta, eliminarVenta, obtenerCorte };
