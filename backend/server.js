require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { requiereSesion, permitirRoles } = require('./middleware/auth.middleware');
const { rutaNoEncontrada, manejadorErrores } = require('./middleware/errores.middleware');

const app = express();

// Solo el front de Angular puede llamar a la API y mandar la cookie
app.use(cors({ origin: process.env.ORIGEN_FRONT || 'http://localhost:4200', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Cabeceras basicas de seguridad
app.use((peticion, respuesta, siguiente) => {
  respuesta.set('X-Content-Type-Options', 'nosniff');
  respuesta.set('X-Frame-Options', 'DENY');
  respuesta.set('Referrer-Policy', 'no-referrer');
  siguiente();
});

const usuarioRoutes = require('./routes/usuario.routes');
const productoRoutes = require('./routes/producto.routes');
const ventaRoutes = require('./routes/venta.routes');
const compraRoutes = require('./routes/compra.routes');
const finanzasRoutes = require('./routes/finanzas.routes');
const empleadoRoutes = require('./routes/empleado.routes');
const clienteRoutes = require('./routes/cliente.routes');
const paypalRoutes = require('./routes/paypal.routes');

// usuarios: el login es publico, lo demas lo protege la propia ruta
app.use('/api/usuarios', usuarioRoutes);

// Cada modulo pide sesion y luego revisa el rol
app.use('/api/productos', requiereSesion, productoRoutes);
app.use('/api/ventas', requiereSesion, permitirRoles('comandante', 'cajero'), ventaRoutes);
app.use('/api/clientes', requiereSesion, permitirRoles('comandante', 'cajero'), clienteRoutes);
app.use('/api/paypal', requiereSesion, permitirRoles('comandante', 'cajero'), paypalRoutes);
app.use('/api/compras', requiereSesion, permitirRoles('comandante', 'almacenista'), compraRoutes);
app.use('/api/finanzas', requiereSesion, permitirRoles('comandante'), finanzasRoutes);
app.use('/api/empleados', requiereSesion, permitirRoles('comandante', 'tripulacion'), empleadoRoutes);

app.use(rutaNoEncontrada);
app.use(manejadorErrores);

const puerto = process.env.PUERTO || 3200;
app.listen(puerto, () => {
  console.log('Servidor ejecutandose en http://localhost:' + puerto);
});
