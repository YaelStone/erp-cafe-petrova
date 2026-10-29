const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const usuarioService = require('../services/usuario.service');
const { requiereSesion, permitirRoles, limitarIntentos } = require('../middleware/auth.middleware');

const OCHO_HORAS = 8 * 60 * 60 * 1000;
const ROLES = ['comandante', 'cajero', 'almacenista', 'tripulacion'];

// Inicio de sesion: si todo cuadra se guarda el token en una cookie httpOnly
router.post('/login', limitarIntentos, (peticion, respuesta) => {
  const correo = peticion.body.correo;
  const contrasena = peticion.body.contrasena;

  if (!correo || !contrasena) {
    respuesta.status(400).json({ mensaje: 'Escribe correo y contrasena' });
    return;
  }

  usuarioService.login(correo, contrasena, (error, usuario) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al iniciar sesion' });
      return;
    }
    if (!usuario) {
      respuesta.status(401).json({ mensaje: 'Usuario o contrasena incorrectos' });
      return;
    }

    const datos = { id: usuario.id_usuario, idEmpleado: usuario.id_empleado, correo: usuario.correo, rol: usuario.rol, nombre: usuario.nombre };
    const token = jwt.sign(datos, process.env.JWT_SECRETO, { expiresIn: '8h' });

    respuesta.cookie('sesion', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: OCHO_HORAS
    });
    respuesta.json(datos);
  });
});

// Quien esta conectado (para recargar la pagina sin perder la sesion)
router.get('/sesion', requiereSesion, (peticion, respuesta) => {
  respuesta.json(peticion.usuario);
});

router.post('/logout', (peticion, respuesta) => {
  respuesta.clearCookie('sesion');
  respuesta.json({ mensaje: 'Sesion cerrada' });
});

// Gestion de usuarios: solo el comandante
router.use(requiereSesion, permitirRoles('comandante'));

router.get('/', (peticion, respuesta) => {
  usuarioService.obtenerUsuarios((error, usuarios) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al consultar usuarios' });
      return;
    }
    respuesta.json(usuarios);
  });
});

router.post('/', (peticion, respuesta) => {
  const u = peticion.body;
  if (!u.correo || !u.contrasena || u.contrasena.length < 8 || !ROLES.includes(u.rol)) {
    respuesta.status(400).json({ mensaje: 'Correo, rol valido y contrasena de 8 caracteres o mas' });
    return;
  }
  usuarioService.crearUsuario(u, (error, resultado) => {
    if (error) {
      respuesta.status(error.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ mensaje: 'No se pudo guardar el usuario (el correo ya existe?)' });
      return;
    }
    respuesta.json({ mensaje: 'Usuario guardado', id: resultado.insertId });
  });
});

router.put('/:id/estado', (peticion, respuesta) => {
  usuarioService.cambiarEstado(peticion.params.id, peticion.body.activo, (error) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al cambiar el estado' });
      return;
    }
    respuesta.json({ mensaje: 'Estado actualizado' });
  });
});

router.delete('/:id', (peticion, respuesta) => {
  if (Number(peticion.params.id) === peticion.usuario.id) {
    respuesta.status(400).json({ mensaje: 'No puedes borrar tu propio usuario' });
    return;
  }
  usuarioService.eliminarUsuario(peticion.params.id, (error) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al borrar el usuario' });
      return;
    }
    respuesta.json({ mensaje: 'Usuario borrado' });
  });
});

module.exports = router;
