// Empleados y rotaciones (tripulacion)
const conexion = require('../config/db');

function obtenerEmpleados(callback) {
  conexion.query('SELECT * FROM empleado', callback);
}

function crearEmpleado(empleado, callback) {
  const sql = 'INSERT INTO empleado (nombre, puesto, telefono, fecha_ingreso, sueldo_hora) VALUES (?, ?, ?, ?, ?)';
  const datos = [empleado.nombre, empleado.puesto, empleado.telefono, empleado.fechaIngreso, empleado.sueldoHora];
  conexion.query(sql, datos, callback);
}

function actualizarEmpleado(id, empleado, callback) {
  const sql = 'UPDATE empleado SET nombre = ?, puesto = ?, telefono = ?, sueldo_hora = ? WHERE id_empleado = ?';
  conexion.query(sql, [empleado.nombre, empleado.puesto, empleado.telefono, empleado.sueldoHora, id], callback);
}

function eliminarEmpleado(id, callback) {
  conexion.query('DELETE FROM empleado WHERE id_empleado = ?', [id], callback);
}

function obtenerRotaciones(callback) {
  const sql = "SELECT r.*, e.nombre FROM rotacion r JOIN empleado e ON e.id_empleado = r.id_empleado ORDER BY FIELD(r.dia, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'), r.hora_inicio";
  conexion.query(sql, callback);
}

function crearRotacion(rotacion, callback) {
  const sql = 'INSERT INTO rotacion (id_empleado, dia, hora_inicio, hora_fin) VALUES (?, ?, ?, ?)';
  conexion.query(sql, [rotacion.idEmpleado, rotacion.dia, rotacion.horaInicio, rotacion.horaFin], callback);
}

function eliminarRotacion(id, callback) {
  conexion.query('DELETE FROM rotacion WHERE id_rotacion = ?', [id], callback);
}

module.exports = { obtenerEmpleados, crearEmpleado, actualizarEmpleado, eliminarEmpleado, obtenerRotaciones, crearRotacion, eliminarRotacion };
