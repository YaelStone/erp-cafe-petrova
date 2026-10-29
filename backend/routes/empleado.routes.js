const express = require('express');
const router = express.Router();
const empleadoService = require('../services/empleado.service');

router.get('/', (peticion, respuesta) => {
  empleadoService.obtenerEmpleados((error, empleados) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al consultar empleados' });
      return;
    }
    respuesta.json(empleados);
  });
});

router.post('/', (peticion, respuesta) => {
  empleadoService.crearEmpleado(peticion.body, (error, resultado) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al guardar el empleado' });
      return;
    }
    respuesta.json({ mensaje: 'Empleado guardado', id: resultado.insertId });
  });
});

router.put('/:id', (peticion, respuesta) => {
  empleadoService.actualizarEmpleado(peticion.params.id, peticion.body, (error) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al actualizar el empleado' });
      return;
    }
    respuesta.json({ mensaje: 'Empleado actualizado' });
  });
});

router.delete('/:id', (peticion, respuesta, siguiente) => {
  empleadoService.eliminarEmpleado(peticion.params.id, (error) => {
    if (error) {
      siguiente(error);
      return;
    }
    respuesta.json({ mensaje: 'Empleado borrado' });
  });
});

// Rotaciones
router.get('/rotaciones/lista', (peticion, respuesta) => {
  empleadoService.obtenerRotaciones((error, rotaciones) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al consultar rotaciones' });
      return;
    }
    respuesta.json(rotaciones);
  });
});

router.post('/rotaciones', (peticion, respuesta) => {
  empleadoService.crearRotacion(peticion.body, (error, resultado) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al guardar la rotacion' });
      return;
    }
    respuesta.json({ mensaje: 'Rotacion guardada', id: resultado.insertId });
  });
});

router.delete('/rotaciones/:id', (peticion, respuesta) => {
  empleadoService.eliminarRotacion(peticion.params.id, (error) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al borrar la rotacion' });
      return;
    }
    respuesta.json({ mensaje: 'Rotacion borrada' });
  });
});

module.exports = router;
