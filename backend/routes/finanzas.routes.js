const express = require('express');
const router = express.Router();
const finanzasService = require('../services/finanzas.service');

router.get('/movimientos', (peticion, respuesta) => {
  finanzasService.obtenerMovimientos((error, movimientos) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al consultar movimientos' });
      return;
    }
    respuesta.json(movimientos);
  });
});

router.post('/movimientos', (peticion, respuesta, siguiente) => {
  finanzasService.crearMovimiento(peticion.body, (error, resultado) => {
    if (error) {
      siguiente(error);
      return;
    }
    respuesta.json({ mensaje: 'Movimiento guardado', id: resultado.insertId });
  });
});

// Balance de Energia
router.get('/balance', (peticion, respuesta) => {
  finanzasService.obtenerBalance(peticion.query.desde, peticion.query.hasta, (error, balance) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al calcular el balance' });
      return;
    }
    respuesta.json(balance);
  });
});

router.get('/mas-vendidos', (peticion, respuesta) => {
  finanzasService.obtenerMasVendidos((error, productos) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al consultar el reporte' });
      return;
    }
    respuesta.json(productos);
  });
});

router.get('/ventas-por-dia', (peticion, respuesta) => {
  finanzasService.obtenerVentasPorDia((error, dias) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al consultar el reporte' });
      return;
    }
    respuesta.json(dias);
  });
});

router.get('/formas-pago', (peticion, respuesta) => {
  finanzasService.obtenerPorFormaPago((error, formas) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al consultar el reporte' });
      return;
    }
    respuesta.json(formas);
  });
});

module.exports = router;
