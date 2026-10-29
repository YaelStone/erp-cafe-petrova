const express = require('express');
const router = express.Router();
const clienteService = require('../services/cliente.service');

router.get('/', (peticion, respuesta) => {
  clienteService.obtenerClientes((error, clientes) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al consultar clientes' });
      return;
    }
    respuesta.json(clientes);
  });
});

router.post('/', (peticion, respuesta) => {
  clienteService.crearCliente(peticion.body, (error, resultado) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al guardar el cliente' });
      return;
    }
    respuesta.json({ mensaje: 'Cliente guardado', id: resultado.insertId });
  });
});

router.put('/:id', (peticion, respuesta) => {
  clienteService.actualizarCliente(peticion.params.id, peticion.body, (error) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al actualizar el cliente' });
      return;
    }
    respuesta.json({ mensaje: 'Cliente actualizado' });
  });
});

router.put('/:id/puntos', (peticion, respuesta) => {
  clienteService.sumarPuntos(peticion.params.id, peticion.body.puntos, (error) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al sumar puntos' });
      return;
    }
    respuesta.json({ mensaje: 'Puntos actualizados' });
  });
});

module.exports = router;
