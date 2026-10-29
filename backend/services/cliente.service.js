// Clientes del programa Amaze
const conexion = require('../config/db');

function obtenerClientes(callback) {
  conexion.query('SELECT * FROM cliente', callback);
}

function crearCliente(cliente, callback) {
  const sql = 'INSERT INTO cliente (nombre, telefono, correo, puntos) VALUES (?, ?, ?, 0)';
  conexion.query(sql, [cliente.nombre, cliente.telefono, cliente.correo], callback);
}

function actualizarCliente(id, cliente, callback) {
  const sql = 'UPDATE cliente SET nombre = ?, telefono = ?, correo = ? WHERE id_cliente = ?';
  conexion.query(sql, [cliente.nombre, cliente.telefono, cliente.correo, id], callback);
}

function sumarPuntos(id, puntos, callback) {
  conexion.query('UPDATE cliente SET puntos = puntos + ? WHERE id_cliente = ?', [puntos, id], callback);
}

module.exports = { obtenerClientes, crearCliente, actualizarCliente, sumarPuntos };
