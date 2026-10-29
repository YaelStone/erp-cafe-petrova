// Cobro con PayPal (API REST v2, modo sandbox)
const ventaService = require('./venta.service');

const API = process.env.PAYPAL_API || 'https://api-m.sandbox.paypal.com';

// Pide un token de acceso con el client id y el secret del .env
function obtenerToken(callback) {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    callback({ estado: 503, message: 'PayPal no esta configurado en el .env' });
    return;
  }
  const llave = Buffer.from(process.env.PAYPAL_CLIENT_ID + ':' + process.env.PAYPAL_CLIENT_SECRET).toString('base64');

  fetch(API + '/v1/oauth2/token', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + llave, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  })
    .then(r => r.json())
    .then(datos => {
      if (!datos.access_token) {
        callback({ estado: 502, message: 'PayPal rechazo las credenciales' });
        return;
      }
      callback(null, datos.access_token);
    })
    .catch(error => callback(error));
}

// Crea la orden con el total que calcula el servidor
function crearOrden(productos, callback) {
  ventaService.calcularTotales(productos, (error, cuenta) => {
    if (error) {
      callback(error);
      return;
    }
    obtenerToken((error2, token) => {
      if (error2) {
        callback(error2);
        return;
      }
      fetch(API + '/v2/checkout/orders', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            description: 'Cafe Petrova Line',
            amount: { currency_code: 'MXN', value: cuenta.total.toFixed(2) }
          }]
        })
      })
        .then(r => r.json())
        .then(orden => callback(null, { id: orden.id, total: cuenta.total }))
        .catch(error3 => callback(error3));
    });
  });
}

// Captura el pago aprobado y, solo si se completo, guarda la venta
function capturarOrden(idOrden, venta, callback) {
  obtenerToken((error, token) => {
    if (error) {
      callback(error);
      return;
    }
    fetch(API + '/v2/checkout/orders/' + encodeURIComponent(idOrden) + '/capture', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
    })
      .then(r => r.json())
      .then(captura => {
        if (captura.status !== 'COMPLETED') {
          callback({ estado: 402, message: 'PayPal no completo el pago' });
          return;
        }
        const pago = captura.purchase_units[0].payments.captures[0];
        venta.formaPago = 'paypal';
        venta.idPaypal = pago.id;
        ventaService.crearVenta(venta, callback);
      })
      .catch(error2 => callback(error2));
  });
}

module.exports = { crearOrden, capturarOrden };
