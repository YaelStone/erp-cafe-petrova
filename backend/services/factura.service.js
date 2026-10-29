// Factura en XML (estructura tipo CFDI) y envio por correo
const conexion = require('../config/db');
const nodemailer = require('nodemailer');

// Escapa los caracteres especiales de XML
function limpiar(texto) {
  return String(texto == null ? '' : texto)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function dinero(numero) {
  return Number(numero).toFixed(2);
}

// Arma el XML con los datos de la venta guardada
function generarXml(idVenta, callback) {
  const sqlVenta = 'SELECT v.*, c.nombre AS cliente, c.correo AS correo_cliente, e.nombre AS cajero FROM venta v LEFT JOIN cliente c ON c.id_cliente = v.id_cliente JOIN empleado e ON e.id_empleado = v.id_empleado WHERE v.id_venta = ?';
  conexion.query(sqlVenta, [idVenta], (error, ventas) => {
    if (error) {
      callback(error);
      return;
    }
    if (ventas.length === 0) {
      callback({ estado: 404, message: 'La venta no existe' });
      return;
    }
    const venta = ventas[0];

    const sqlDetalle = 'SELECT p.codigo, p.nombre, d.cantidad, d.precio_unitario FROM detalle_venta d JOIN producto p ON p.id_producto = d.id_producto WHERE d.id_venta = ?';
    conexion.query(sqlDetalle, [idVenta], (error2, detalles) => {
      if (error2) {
        callback(error2);
        return;
      }

      let conceptos = '';
      for (const d of detalles) {
        conceptos += '    <Concepto clave="' + limpiar(d.codigo) + '" descripcion="' + limpiar(d.nombre) +
          '" cantidad="' + d.cantidad + '" valorUnitario="' + dinero(d.precio_unitario) +
          '" importe="' + dinero(d.cantidad * d.precio_unitario) + '"/>\n';
      }

      const paypal = venta.id_pago_paypal ? ' idPagoPaypal="' + limpiar(venta.id_pago_paypal) + '"' : '';
      const xml =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<Factura folio="PL-' + venta.id_venta + '" fecha="' + venta.fecha + '" moneda="MXN" formaPago="' + limpiar(venta.forma_pago) + '"' + paypal + '>\n' +
        '  <Emisor nombre="Cafe Petrova Line" rfc="CPL260101AB1" regimen="601" lugarExpedicion="44100"/>\n' +
        '  <Receptor nombre="' + limpiar(venta.cliente || 'Publico en general') + '" rfc="XAXX010101000" correo="' + limpiar(venta.correo_cliente) + '"/>\n' +
        '  <Atendio nombre="' + limpiar(venta.cajero) + '"/>\n' +
        '  <Conceptos>\n' + conceptos + '  </Conceptos>\n' +
        '  <Impuestos tipo="IVA" tasa="0.16" importe="' + dinero(venta.iva) + '"/>\n' +
        '  <Totales subtotal="' + dinero(venta.subtotal) + '" iva="' + dinero(venta.iva) + '" total="' + dinero(venta.total) + '"/>\n' +
        '</Factura>\n';

      callback(null, xml, venta);
    });
  });
}

// Si no hay SMTP en el .env se usa una cuenta de prueba de Ethereal
let transporte = null;
function obtenerTransporte(callback) {
  if (transporte) {
    callback(null, transporte);
    return;
  }
  if (process.env.SMTP_USER) {
    transporte = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    callback(null, transporte);
    return;
  }
  nodemailer.createTestAccount((error, cuenta) => {
    if (error) {
      callback(error);
      return;
    }
    console.log('Correo de prueba Ethereal:', cuenta.user);
    transporte = nodemailer.createTransport({
      host: cuenta.smtp.host,
      port: cuenta.smtp.port,
      secure: cuenta.smtp.secure,
      auth: { user: cuenta.user, pass: cuenta.pass }
    });
    callback(null, transporte);
  });
}

// Manda la factura como archivo adjunto
function enviarFactura(idVenta, correo, callback) {
  generarXml(idVenta, (error, xml, venta) => {
    if (error) {
      callback(error);
      return;
    }
    const destino = correo || venta.correo_cliente;
    if (!destino || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destino)) {
      callback({ estado: 400, message: 'El cliente no tiene un correo valido' });
      return;
    }

    obtenerTransporte((error2, smtp) => {
      if (error2) {
        callback(error2);
        return;
      }
      smtp.sendMail({
        from: '"Cafe Petrova Line" <' + (process.env.SMTP_USER || 'facturas@petrova-line.test') + '>',
        to: destino,
        subject: 'Factura PL-' + venta.id_venta + ' - Cafe Petrova Line',
        text: 'Hola ' + (venta.cliente || '') + ', gracias por tu compra. Te mandamos tu factura en XML. Total: $' + dinero(venta.total) + ' MXN.',
        html: '<p>Hola <b>' + limpiar(venta.cliente || '') + '</b>, gracias por tu compra en Cafe Petrova Line.</p>' +
          '<p>Adjuntamos tu factura <b>PL-' + venta.id_venta + '</b> en formato XML.</p><p>Total: <b>$' + dinero(venta.total) + ' MXN</b></p>',
        attachments: [{ filename: 'factura-PL-' + venta.id_venta + '.xml', content: xml, contentType: 'application/xml' }]
      }, (error3, info) => {
        if (error3) {
          callback(error3);
          return;
        }
        // Con Ethereal el correo se puede ver en esta liga
        callback(null, { destino: destino, idMensaje: info.messageId, vistaPrevia: nodemailer.getTestMessageUrl(info) || null });
      });
    });
  });
}

module.exports = { generarXml, enviarFactura };
