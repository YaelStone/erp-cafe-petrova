// Acceso al sistema
const conexion = require('../config/db');
const bcrypt = require('bcryptjs');

// Busca al usuario por correo y compara la contrasena contra el hash
function login(correo, contrasena, callback) {
  const sql = 'SELECT u.id_usuario, u.id_empleado, u.correo, u.contrasena, u.rol, u.activo, e.nombre FROM usuario u LEFT JOIN empleado e ON e.id_empleado = u.id_empleado WHERE u.correo = ?';
  conexion.query(sql, [correo], (error, usuarios) => {
    if (error) {
      callback(error);
      return;
    }
    if (usuarios.length === 0 || !usuarios[0].activo) {
      callback(null, null);
      return;
    }
    bcrypt.compare(contrasena, usuarios[0].contrasena, (error2, coincide) => {
      if (error2 || !coincide) {
        callback(error2, null);
        return;
      }
      const usuario = usuarios[0];
      delete usuario.contrasena;
      callback(null, usuario);
    });
  });
}

function obtenerUsuarios(callback) {
  const sql = 'SELECT u.id_usuario, u.id_empleado, u.correo, u.rol, u.activo, e.nombre FROM usuario u LEFT JOIN empleado e ON e.id_empleado = u.id_empleado';
  conexion.query(sql, callback);
}

// La contrasena se guarda como hash, nunca en texto
function crearUsuario(usuario, callback) {
  bcrypt.hash(usuario.contrasena, 10, (error, hash) => {
    if (error) {
      callback(error);
      return;
    }
    const sql = 'INSERT INTO usuario (id_empleado, correo, contrasena, rol) VALUES (?, ?, ?, ?)';
    conexion.query(sql, [usuario.idEmpleado || null, usuario.correo, hash, usuario.rol], callback);
  });
}

function cambiarEstado(id, activo, callback) {
  conexion.query('UPDATE usuario SET activo = ? WHERE id_usuario = ?', [activo ? 1 : 0, id], callback);
}

function eliminarUsuario(id, callback) {
  conexion.query('DELETE FROM usuario WHERE id_usuario = ?', [id], callback);
}

module.exports = { login, obtenerUsuarios, crearUsuario, cambiarEstado, eliminarUsuario };
