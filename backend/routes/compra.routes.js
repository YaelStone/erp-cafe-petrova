const express = require('express');
const router = express.Router();
const compraService = require('../services/compra.service');

// Proveedores
router.get('/proveedores', (peticion, respuesta) => {
  compraService.obtenerProveedores((error, proveedores) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al consultar proveedores' });
      return;
    }
    respuesta.json(proveedores);
  });
});

router.post('/proveedores', (peticion, respuesta) => {
  compraService.crearProveedor(peticion.body, (error, resultado) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al guardar el proveedor' });
      return;
    }
    respuesta.json({ mensaje: 'Proveedor guardado', id: resultado.insertId });
  });
});

router.put('/proveedores/:id', (peticion, respuesta) => {
  compraService.actualizarProveedor(peticion.params.id, peticion.body, (error) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al actualizar el proveedor' });
      return;
    }
    respuesta.json({ mensaje: 'Proveedor actualizado' });
  });
});

router.delete('/proveedores/:id', (peticion, respuesta, siguiente) => {
  compraService.eliminarProveedor(peticion.params.id, (error) => {
    if (error) {
      siguiente(error);
      return;
    }
    respuesta.json({ mensaje: 'Proveedor borrado' });
  });
});

// Manifiestos de carga
router.get('/', (peticion, respuesta) => {
  compraService.obtenerCompras((error, compras) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al consultar compras' });
      return;
    }
    respuesta.json(compras);
  });
});

router.get('/:id', (peticion, respuesta) => {
  compraService.obtenerDetalleCompra(peticion.params.id, (error, detalle) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al consultar el manifiesto' });
      return;
    }
    respuesta.json(detalle);
  });
});

router.post('/', (peticion, respuesta, siguiente) => {
  compraService.crearCompra(peticion.body, (error, compra) => {
    if (error) {
      siguiente(error);
      return;
    }
    respuesta.json(compra);
  });
});

// Recibir la mercancia
router.put('/:id/recibir', (peticion, respuesta, siguiente) => {
  compraService.recibirCompra(peticion.params.id, (error) => {
    if (error) {
      siguiente(error);
      return;
    }
    respuesta.json({ mensaje: 'Compra recibida' });
  });
});

// Cambiar el estado de pago
router.put('/:id/pago', (peticion, respuesta) => {
  if (!['pendiente', 'pagado'].includes(peticion.body.estado)) {
    respuesta.status(400).json({ mensaje: 'Estado de pago no valido' });
    return;
  }
  compraService.cambiarEstadoPago(peticion.params.id, peticion.body.estado, (error) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al cambiar el estado' });
      return;
    }
    respuesta.json({ mensaje: 'Estado actualizado' });
  });
});

module.exports = router;
