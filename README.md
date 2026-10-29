# ERP Café Petrova Line

ERP web para la cafetería espacial **Café Petrova Line** (temática Proyecto Hail Mary).
Francisco Yael Pérez Palacios · 23300664

| Capa | Tecnología |
|---|---|
| Frontend | Angular 22 (componentes standalone, signals, guards, interceptor) |
| Backend | Node.js + Express 4 (rutas, servicios y middleware) |
| Base de datos | MySQL / MariaDB (XAMPP) |
| Servicios externos | PayPal REST v2 (sandbox) y correo SMTP con Nodemailer (factura XML adjunta) |

## Módulos

| Módulo | Pantalla | Roles |
|---|---|---|
| Finanzas y contabilidad | Balance de Energía: movimientos, balance por fechas, ventas por día, formas de pago, más vendidos | comandante |
| Compras y Proveedores | Manifiestos de Carga: alta, recepción (suma al inventario), pago (egreso en finanzas), proveedores | comandante, almacenista |
| Ventas | Bitácora de Misión: ticket, cobro en efectivo/tarjeta/transferencia/PayPal, factura XML por correo, corte | comandante, cajero |
| RRHH | Tripulación: alta, edición y baja de empleados, rotaciones y nómina estimada | comandante, tripulacion |
| Inventario | Bodega de Combustible: catálogo, entradas, merma, alertas de stock mínimo | comandante, almacenista |
| Clientes (apoyo a Ventas) | Programa Amaze: socios, correo para facturas y puntos | comandante, cajero |
| Usuarios | Cuentas, roles y activación | comandante |

## Seguridad (middleware)

- `requiereSesion`: valida el JWT guardado en una cookie `httpOnly` (`sameSite=lax`, 8 h). Sin token → 401.
- `permitirRoles(...)`: cada módulo se monta en `server.js` con sus roles. Rol incorrecto → 403.
- `limitarIntentos`: máximo 5 intentos de login por minuto por IP → 429.
- `manejadorErrores` y `rutaNoEncontrada`: JSON inválido → 400, duplicados → 409, rutas inexistentes → 404.
- Contraseñas con `bcrypt`, consultas con parámetros `?` (sin inyección SQL), claves en `.env`.
- El total de la venta y de la orden de PayPal lo calcula el servidor con los precios de la base.
- En Angular: `sesionGuard`, `rolGuard`, `invitadoGuard` y un interceptor que regresa al login con un 401.

## Cómo correrlo

1. Importa `backend/sql/petrova_erp.sql` en phpMyAdmin (crea la base `petrova_erp`).
2. Backend:

   ```bash
   cd backend
   npm install
   cp .env.example .env   # llena PAYPAL_* y SMTP_* (opcional)
   node server.js         # http://localhost:3200
   ```

3. Frontend (otra terminal):

   ```bash
   cd frontend
   npm install
   npx ng serve           # http://localhost:4200 (el proxy manda /api al 3200)
   ```

Usuarios de prueba (contraseña `petrova123`): `comandante@petrova.com`, `cajero@petrova.com`, `almacen@petrova.com`, `tripulacion@petrova.com`.

### PayPal sandbox

En https://developer.paypal.com → *Apps & Credentials* (modo Sandbox) crea una app y copia
`Client ID` y `Secret` en `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET`. Para pagar usa la cuenta
*personal* de prueba que PayPal genera en *Sandbox accounts*.

### Correo

Con `SMTP_USER` y `SMTP_PASS` (Gmail con contraseña de aplicación) la factura llega al correo real del cliente.
Si se dejan vacíos, el backend usa una cuenta de prueba de **Ethereal** y responde con una liga para ver el correo enviado.

## Estructura

```
erp-cafe-petrova/
├── backend/
│   ├── server.js            montaje de rutas con su middleware
│   ├── config/db.js
│   ├── middleware/          auth.middleware.js, errores.middleware.js
│   ├── models/
│   ├── routes/              una por módulo + paypal.routes.js
│   ├── services/            una por módulo + paypal.service.js, factura.service.js
│   └── sql/petrova_erp.sql
├── frontend/
│   └── src/app/
│       ├── modulos.ts       permisos por módulo (menú, inicio y rolGuard)
│       ├── modelos.ts       clases del diagrama de clases
│       ├── servicios/       api, sesion, guards, interceptor
│       └── paginas/         login, inicio y una pantalla por módulo
└── docs/                    SRS en PDF y diagramas
```
