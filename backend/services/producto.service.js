// Consultas de productos (Bodega de Combustible)
const conexion = require('../config/db');

function obtenerProductos(callback) {
  conexion.query('SELECT * FROM producto', callback);
}

function obtenerProducto(id, callback) {
  conexion.query('SELECT * FROM producto WHERE id_producto = ?', [id], callback);
}

function crearProducto(producto, callback) {
  const sql = 'INSERT INTO producto (codigo, nombre, temperatura, kcal, precio, existencia, stock_minimo) VALUES (?, ?, ?, ?, ?, ?, ?)';
  const datos = [producto.codigo, producto.nombre, producto.temperatura, producto.kcal, producto.precio, producto.existencia, producto.stockMinimo];
  conexion.query(sql, datos, callback);
}

function actualizarProducto(id, producto, callback) {
  const sql = 'UPDATE producto SET nombre = ?, temperatura = ?, kcal = ?, precio = ?, stock_minimo = ? WHERE id_producto = ?';
  const datos = [producto.nombre, producto.temperatura, producto.kcal, producto.precio, producto.stockMinimo, id];
  conexion.query(sql, datos, callback);
}

function eliminarProducto(id, callback) {
  conexion.query('DELETE FROM producto WHERE id_producto = ?', [id], callback);
}

// Entrada de producto: suma a la existencia
function registrarEntrada(id, cantidad, callback) {
  conexion.query('UPDATE producto SET existencia = existencia + ? WHERE id_producto = ?', [cantidad, id], callback);
}

// Merma: guarda el registro y resta de la existencia
function registrarMerma(merma, callback) {
  const sql = 'INSERT INTO merma (id_producto, cantidad, motivo, fecha) VALUES (?, ?, ?, CURDATE())';
  conexion.query(sql, [merma.idProducto, merma.cantidad, merma.motivo], (error, resultado) => {
    if (error) {
      callback(error);
      return;
    }
    conexion.query('UPDATE producto SET existencia = existencia - ? WHERE id_producto = ?', [merma.cantidad, merma.idProducto], (error2) => {
      callback(error2, resultado);
    });
  });
}

// Productos que ya llegaron a su stock minimo
function obtenerAlertas(callback) {
  conexion.query('SELECT * FROM producto WHERE existencia <= stock_minimo', callback);
}

module.exports = {
  obtenerProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  registrarEntrada,
  registrarMerma,
  obtenerAlertas
};
