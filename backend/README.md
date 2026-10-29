# backend — API del ERP Café Petrova Line

Node.js + Express + MySQL. Misma estructura de los apuntes:
`server.js`, `config/db.js`, `models`, `services` y `routes`, más `middleware` para la seguridad.

## Instalar y arrancar

```bash
npm install
cp .env.example .env
node server.js
```

Debe salir:

```
Servidor ejecutandose en http://localhost:3200
Conectado a MySQL
```

## Rutas de la API

| Módulo | Ruta | Acceso |
|---|---|---|
| Acceso | POST `/api/usuarios/login`, GET `/api/usuarios/sesion`, POST `/api/usuarios/logout` | público / sesión |
| Usuarios | GET / POST `/api/usuarios`, PUT `/api/usuarios/:id/estado`, DELETE `/api/usuarios/:id` | comandante |
| Inventario | GET `/api/productos`, `/alertas`, `/:id` | cualquier sesión |
| Inventario | POST / PUT / DELETE `/api/productos`, POST `/:id/entrada`, POST `/merma` | comandante, almacenista |
| Ventas | GET / POST `/api/ventas`, GET `/corte`, GET `/:id`, DELETE `/:id` | comandante, cajero |
| Ventas | GET `/api/ventas/:id/xml` (factura), POST `/api/ventas/:id/enviar` (correo) | comandante, cajero |
| PayPal | GET `/api/paypal/config`, POST `/orden`, POST `/captura` | comandante, cajero |
| Clientes | GET / POST `/api/clientes`, PUT `/:id`, PUT `/:id/puntos` | comandante, cajero |
| Compras | GET / POST / PUT / DELETE `/api/compras/proveedores` | comandante, almacenista |
| Compras | GET / POST `/api/compras`, GET `/:id`, PUT `/:id/recibir`, PUT `/:id/pago` | comandante, almacenista |
| Finanzas | GET / POST `/movimientos`, GET `/balance?desde&hasta`, `/mas-vendidos`, `/ventas-por-dia`, `/formas-pago` | comandante |
| Tripulación | GET / POST / PUT / DELETE `/api/empleados`, GET `/rotaciones/lista`, POST / DELETE `/rotaciones` | comandante, tripulacion |

Códigos de error: 400 datos inválidos, 401 sin sesión, 403 rol sin permiso, 404 ruta inexistente,
409 duplicado o con dependencias, 429 demasiados intentos, 503 PayPal sin configurar.
