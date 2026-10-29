// Prueba de punta a punta de la API: node pruebas/prueba_completa.js (con el servidor prendido)
const API = 'http://localhost:3200/api';
let fallas = 0;

async function pedir(cookie, metodo, ruta, cuerpo) {
  const r = await fetch(API + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', Cookie: cookie || '' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });
  const texto = await r.text();
  let datos;
  try { datos = JSON.parse(texto); } catch { datos = texto; }
  return { estado: r.status, datos, cookie: r.headers.get('set-cookie') };
}

function revisar(nombre, condicion, detalle) {
  console.log((condicion ? 'OK   ' : 'FALLA') + '  ' + nombre + (condicion ? '' : '  -> ' + JSON.stringify(detalle)));
  if (!condicion) fallas++;
}

async function entrar(correo) {
  const r = await pedir('', 'POST', '/usuarios/login', { correo, contrasena: 'petrova123' });
  return r.cookie.split(';')[0];
}

(async () => {
  // ---------- seguridad ----------
  let r = await pedir('', 'GET', '/productos');
  revisar('sin sesion -> 401', r.estado === 401, r);
  const com = await entrar('comandante@petrova.com');
  const caj = await entrar('cajero@petrova.com');
  const alm = await entrar('almacen@petrova.com');
  const tri = await entrar('tripulacion@petrova.com');
  revisar('login de los 4 roles', com && caj && alm && tri);
  r = await pedir(caj, 'GET', '/finanzas/balance');
  revisar('cajero a finanzas -> 403', r.estado === 403, r);
  r = await pedir(alm, 'GET', '/ventas');
  revisar('almacenista a ventas -> 403', r.estado === 403, r);
  r = await pedir(tri, 'GET', '/compras');
  revisar('tripulacion a compras -> 403', r.estado === 403, r);
  r = await pedir(caj, 'POST', '/productos', { nombre: 'x', precio: 1 });
  revisar('cajero crea producto -> 403', r.estado === 403, r);
  r = await pedir(caj, 'GET', '/usuarios/sesion');
  revisar('sesion del cajero', r.datos.rol === 'cajero', r);

  // ---------- inventario ----------
  r = await pedir(alm, 'POST', '/productos', { codigo: 'P-PRB', nombre: 'Producto de prueba', temperatura: 'frio', kcal: 10, precio: 20, existencia: 5, stockMinimo: 2 });
  revisar('alta de producto', r.estado === 200, r);
  const idProd = r.datos.id;
  r = await pedir(alm, 'PUT', '/productos/' + idProd, { nombre: 'Producto de prueba 2', temperatura: 'frio', kcal: 10, precio: 25, stockMinimo: 2 });
  revisar('editar producto', r.estado === 200, r);
  r = await pedir(alm, 'POST', '/productos/' + idProd + '/entrada', { cantidad: 10 });
  revisar('entrada de mercancia', r.estado === 200, r);
  r = await pedir(alm, 'POST', '/productos/merma', { idProducto: idProd, cantidad: 3, motivo: 'derrame' });
  revisar('merma', r.estado === 200, r);
  r = await pedir(alm, 'GET', '/productos/' + idProd);
  revisar('existencia 5 + 10 - 3 = 12', r.datos.existencia === 12, r.datos);
  r = await pedir(alm, 'GET', '/productos/alertas');
  revisar('alertas de stock', Array.isArray(r.datos) && r.datos.length >= 1, r);

  // ---------- compras ----------
  r = await pedir(alm, 'POST', '/compras/proveedores', { nombre: 'Proveedor de prueba', telefono: '3300000000', correo: 'proveedor@example.com' });
  revisar('alta de proveedor', r.estado === 200, r);
  const idProv = r.datos.id;
  r = await pedir(alm, 'POST', '/compras', { idProveedor: idProv, productos: [{ idProducto: idProd, cantidad: 4, costoUnitario: 10 }] });
  revisar('manifiesto de carga por 40', r.estado === 200 && r.datos.total === 40, r);
  const idCompra = r.datos.id;
  r = await pedir(alm, 'PUT', '/compras/' + idCompra + '/recibir');
  revisar('recibir manifiesto', r.estado === 200, r);
  r = await pedir(alm, 'PUT', '/compras/' + idCompra + '/recibir');
  revisar('recibir dos veces -> 400', r.estado === 400, r);
  r = await pedir(alm, 'GET', '/productos/' + idProd);
  revisar('inventario sube a 16', r.datos.existencia === 16, r.datos);
  r = await pedir(alm, 'PUT', '/compras/' + idCompra + '/pago', { estado: 'pagado' });
  revisar('pagar manifiesto', r.estado === 200, r);

  // ---------- clientes ----------
  r = await pedir(caj, 'POST', '/clientes', { nombre: 'Cliente de prueba', telefono: '3311112222', correo: 'cliente.prueba@example.com' });
  revisar('alta de cliente', r.estado === 200, r);
  const idCli = r.datos.id;
  r = await pedir(caj, 'PUT', '/clientes/' + idCli, { nombre: 'Cliente de prueba', telefono: '3311112222', correo: 'cliente.prueba@example.com' });
  revisar('editar cliente', r.estado === 200, r);

  // ---------- ventas ----------
  r = await pedir(caj, 'POST', '/ventas', { idCliente: idCli, formaPago: 'tarjeta', productos: [{ idProducto: idProd, cantidad: 2, precio: 0.01 }] });
  revisar('venta: precio de la base (2 x 25 + IVA = 58)', r.estado === 200 && r.datos.total === 58, r);
  const idVenta = r.datos.id;
  r = await pedir(caj, 'POST', '/ventas', { formaPago: 'efectivo', productos: [{ idProducto: idProd, cantidad: 999 }] });
  revisar('venta sin existencia -> 400', r.estado === 400, r);
  r = await pedir(caj, 'POST', '/ventas', { formaPago: 'bitcoin', productos: [{ idProducto: idProd, cantidad: 1 }] });
  revisar('forma de pago invalida -> 400', r.estado === 400, r);
  r = await pedir(caj, 'GET', '/ventas/' + idVenta + '/xml');
  revisar('factura XML', r.estado === 200 && String(r.datos).includes('<Totales subtotal="50.00" iva="8.00" total="58.00"/>'), r.datos);
  r = await pedir(caj, 'POST', '/ventas/' + idVenta + '/enviar');
  revisar('enviar factura por correo', r.estado === 200 && r.datos.destino === 'cliente.prueba@example.com', r);
  if (r.datos.vistaPrevia) console.log('       correo: ' + r.datos.vistaPrevia);
  r = await pedir(caj, 'GET', '/ventas/corte');
  revisar('corte de caja', r.estado === 200 && r.datos.tickets >= 1, r);
  r = await pedir(caj, 'GET', '/clientes');
  revisar('puntos del cliente (58 / 10 = 5)', r.datos.find(c => c.id_cliente === idCli).puntos === 5, r.datos);
  r = await pedir(caj, 'DELETE', '/ventas/' + idVenta);
  revisar('cajero cancela -> 403', r.estado === 403, r);
  r = await pedir(com, 'DELETE', '/ventas/' + idVenta);
  revisar('comandante cancela venta', r.estado === 200, r);
  r = await pedir(alm, 'GET', '/productos/' + idProd);
  revisar('existencia regresa a 16', r.datos.existencia === 16, r.datos);

  // ---------- paypal ----------
  r = await pedir(caj, 'GET', '/paypal/config');
  const conPaypal = !!r.datos.clientId;
  r = await pedir(caj, 'POST', '/paypal/orden', { productos: [{ idProducto: idProd, cantidad: 1 }] });
  if (conPaypal) revisar('PayPal crea la orden en sandbox', r.estado === 200 && !!r.datos.id, r);
  else revisar('PayPal sin credenciales -> 503 (falta llenar el .env)', r.estado === 503, r);

  // ---------- finanzas ----------
  r = await pedir(com, 'POST', '/finanzas/movimientos', { tipo: 'egreso', categoria: 'prueba', concepto: 'Movimiento de prueba', monto: 1, fecha: '2026-10-29' });
  revisar('alta de movimiento', r.estado === 200, r);
  for (const ruta of ['/finanzas/balance?desde=2026-01-01&hasta=2026-12-31', '/finanzas/mas-vendidos', '/finanzas/ventas-por-dia', '/finanzas/formas-pago', '/finanzas/movimientos']) {
    r = await pedir(com, 'GET', ruta);
    revisar('GET ' + ruta, r.estado === 200, r);
  }

  // ---------- rrhh ----------
  r = await pedir(tri, 'POST', '/empleados', { nombre: 'Empleado de prueba', puesto: 'Barista', telefono: '3300001111', fechaIngreso: '2026-10-29', sueldoHora: 50 });
  revisar('alta de empleado', r.estado === 200, r);
  const idEmp = r.datos.id;
  r = await pedir(tri, 'PUT', '/empleados/' + idEmp, { nombre: 'Empleado de prueba', puesto: 'Barista', telefono: '3300001111', sueldoHora: 55 });
  revisar('editar empleado', r.estado === 200, r);
  r = await pedir(tri, 'POST', '/empleados/rotaciones', { idEmpleado: idEmp, dia: 'viernes', horaInicio: '08:00', horaFin: '14:00' });
  revisar('asignar rotacion', r.estado === 200, r);
  r = await pedir(tri, 'DELETE', '/empleados/rotaciones/' + r.datos.id);
  revisar('quitar rotacion', r.estado === 200, r);

  // ---------- usuarios ----------
  r = await pedir(com, 'POST', '/usuarios', { idEmpleado: idEmp, correo: 'barista.prueba@petrova.com', contrasena: 'cortita', rol: 'cajero' });
  revisar('contrasena corta -> 400', r.estado === 400, r);
  r = await pedir(com, 'POST', '/usuarios', { idEmpleado: idEmp, correo: 'barista.prueba@petrova.com', contrasena: 'petrova123', rol: 'cajero' });
  revisar('alta de usuario', r.estado === 200, r);
  const idUsr = r.datos.id;
  r = await pedir('', 'POST', '/usuarios/login', { correo: 'barista.prueba@petrova.com', contrasena: 'petrova123' });
  revisar('el usuario nuevo entra', r.estado === 200, r);
  r = await pedir(com, 'PUT', '/usuarios/' + idUsr + '/estado', { activo: false });
  revisar('desactivar usuario', r.estado === 200, r);

  // ---------- limpieza ----------
  await pedir(com, 'DELETE', '/usuarios/' + idUsr);
  r = await pedir(tri, 'DELETE', '/empleados/' + idEmp);
  revisar('baja de empleado', r.estado === 200, r);

  console.log('\n' + (fallas === 0 ? 'Todo paso.' : fallas + ' pruebas fallaron.'));
  process.exit(fallas ? 1 : 0);
})();
