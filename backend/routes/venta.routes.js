const express = require('express');
const router = express.Router();
const ventaService = require('../services/venta.service');
const facturaService = require('../services/factura.service');

// Lista de ventas
router.get('/', (peticion, respuesta) => {
  ventaService.obtenerVentas((error, ventas) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al consultar ventas' });
      return;
    }
    respuesta.json(ventas);
  });
});

// Corte de caja del dia del usuario que esta conectado
router.get('/corte', (peticion, respuesta) => {
  ventaService.obtenerCorte(peticion.usuario.idEmpleado, (error, corte) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al hacer el corte' });
      return;
    }
    respuesta.json(corte[0]);
  });
});

// Factura en XML para descargar
router.get('/:id/xml', (peticion, respuesta, siguiente) => {
  facturaService.generarXml(peticion.params.id, (error, xml) => {
    if (error) {
      siguiente(error);
      return;
    }
    respuesta.set('Content-Type', 'application/xml; charset=utf-8');
    respuesta.set('Content-Disposition', 'attachment; filename="factura-PL-' + peticion.params.id + '.xml"');
    respuesta.send(xml);
  });
});

// Mandar la factura XML por correo al cliente
router.post('/:id/enviar', (peticion, respuesta, siguiente) => {
  facturaService.enviarFactura(peticion.params.id, peticion.body.correo, (error, envio) => {
    if (error) {
      siguiente(error);
      return;
    }
    respuesta.json({ mensaje: 'Factura enviada a ' + envio.destino, ...envio });
  });
});

// Detalle de una venta (ticket)
router.get('/:id', (peticion, respuesta) => {
  ventaService.obtenerVenta(peticion.params.id, (error, detalle) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al consultar la venta' });
      return;
    }
    respuesta.json(detalle);
  });
});

// Registrar venta (efectivo, tarjeta o transferencia). El cajero sale de la sesion
router.post('/', (peticion, respuesta, siguiente) => {
  if (!['efectivo', 'tarjeta', 'transferencia'].includes(peticion.body.formaPago)) {
    respuesta.status(400).json({ mensaje: 'Forma de pago no valida; PayPal se cobra en /api/paypal' });
    return;
  }
  const venta = { ...peticion.body, idEmpleado: peticion.usuario.idEmpleado };
  ventaService.crearVenta(venta, (error, guardada) => {
    if (error) {
      siguiente(error);
      return;
    }
    respuesta.json(guardada);
  });
});

// Cancelar venta (solo el comandante)
router.delete('/:id', (peticion, respuesta) => {
  if (peticion.usuario.rol !== 'comandante') {
    respuesta.status(403).json({ mensaje: 'Solo el comandante puede cancelar ventas' });
    return;
  }
  ventaService.eliminarVenta(peticion.params.id, (error) => {
    if (error) {
      respuesta.status(500).json({ mensaje: 'Error al cancelar la venta' });
      return;
    }
    respuesta.json({ mensaje: 'Venta cancelada' });
  });
});

module.exports = router;
