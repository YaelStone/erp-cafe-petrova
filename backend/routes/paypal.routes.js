const express = require('express');
const router = express.Router();
const paypalService = require('../services/paypal.service');

// El client id es publico; el secret nunca sale del servidor
router.get('/config', (peticion, respuesta) => {
  respuesta.json({ clientId: process.env.PAYPAL_CLIENT_ID || '', moneda: 'MXN' });
});

// Paso 1: crear la orden con el total calculado aqui
router.post('/orden', (peticion, respuesta, siguiente) => {
  paypalService.crearOrden(peticion.body.productos, (error, orden) => {
    if (error) {
      siguiente(error);
      return;
    }
    respuesta.json(orden);
  });
});

// Paso 2: el cliente aprobo en PayPal, se captura y se guarda la venta
router.post('/captura', (peticion, respuesta, siguiente) => {
  const venta = {
    idEmpleado: peticion.usuario.idEmpleado,
    idCliente: peticion.body.idCliente,
    productos: peticion.body.productos
  };
  paypalService.capturarOrden(peticion.body.idOrden, venta, (error, guardada) => {
    if (error) {
      siguiente(error);
      return;
    }
    respuesta.json(guardada);
  });
});

module.exports = router;
