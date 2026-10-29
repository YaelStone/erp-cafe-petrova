// Finanzas (Balance de Energia)
const conexion = require('../config/db');

function obtenerMovimientos(callback) {
  conexion.query('SELECT * FROM movimiento ORDER BY fecha DESC', callback);
}

function crearMovimiento(movimiento, callback) {
  if (!['ingreso', 'egreso'].includes(movimiento.tipo) || !(Number(movimiento.monto) > 0)) {
    callback({ estado: 400, message: 'Tipo ingreso o egreso y monto mayor a cero' });
    return;
  }
  const sql = 'INSERT INTO movimiento (tipo, categoria, concepto, monto, fecha) VALUES (?, ?, ?, ?, ?)';
  const datos = [movimiento.tipo, movimiento.categoria, movimiento.concepto, movimiento.monto, movimiento.fecha];
  conexion.query(sql, datos, callback);
}

// Ingresos, egresos y energia neta
// Si llegan fechas, solo se suman los movimientos de ese rango
function obtenerBalance(desde, hasta, callback) {
  const sql = 'SELECT tipo, SUM(monto) AS total FROM movimiento WHERE fecha BETWEEN ? AND ? GROUP BY tipo';
  conexion.query(sql, [desde || '2000-01-01', hasta || '2999-12-31'], (error, filas) => {
    if (error) {
      callback(error);
      return;
    }

    let ingresos = 0;
    let egresos = 0;
    for (const fila of filas) {
      if (fila.tipo === 'ingreso') {
        ingresos = Number(fila.total);
      } else {
        egresos = Number(fila.total);
      }
    }

    callback(null, { ingresos: ingresos, egresos: egresos, energiaNeta: Math.round((ingresos - egresos) * 100) / 100 });
  });
}

// Los diez productos mas vendidos
function obtenerMasVendidos(callback) {
  const sql = 'SELECT p.nombre, SUM(d.cantidad) AS cantidad, SUM(d.cantidad * d.precio_unitario) AS importe FROM detalle_venta d JOIN producto p ON p.id_producto = d.id_producto GROUP BY p.id_producto ORDER BY cantidad DESC LIMIT 10';
  conexion.query(sql, callback);
}

// Ventas de los ultimos 7 dias
function obtenerVentasPorDia(callback) {
  const sql = 'SELECT fecha, COUNT(*) AS tickets, SUM(total) AS total FROM venta WHERE fecha >= CURDATE() - INTERVAL 6 DAY GROUP BY fecha ORDER BY fecha';
  conexion.query(sql, callback);
}

// Cuanto entra por cada forma de pago (efectivo, tarjeta, transferencia, paypal)
function obtenerPorFormaPago(callback) {
  const sql = 'SELECT forma_pago, COUNT(*) AS tickets, SUM(total) AS total FROM venta GROUP BY forma_pago ORDER BY total DESC';
  conexion.query(sql, callback);
}

module.exports = { obtenerMovimientos, crearMovimiento, obtenerBalance, obtenerMasVendidos, obtenerVentasPorDia, obtenerPorFormaPago };
