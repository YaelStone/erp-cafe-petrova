// Permisos por modulo en un solo lugar: de aqui salen el menu, las tarjetas del inicio y el rolGuard.
// El backend vuelve a revisar el rol en cada peticion (permitirRoles en server.js).

export interface Modulo {
  nombre: string;
  ruta: string;
  codigo: string;
  descripcion: string;
  roles: string[];
}

export const MODULOS: Modulo[] = [
  { nombre: 'Ventas', ruta: '/ventas', codigo: 'VNT', descripcion: 'Bitacora de Mision: cobro, PayPal y factura XML', roles: ['comandante', 'cajero'] },
  { nombre: 'Clientes', ruta: '/clientes', codigo: 'AMZ', descripcion: 'Programa Amaze: socios, correo y puntos', roles: ['comandante', 'cajero'] },
  { nombre: 'Inventario', ruta: '/inventario', codigo: 'INV', descripcion: 'Bodega de Combustible, entradas y merma', roles: ['comandante', 'almacenista'] },
  { nombre: 'Compras', ruta: '/compras', codigo: 'CMP', descripcion: 'Manifiestos de Carga y proveedores', roles: ['comandante', 'almacenista'] },
  { nombre: 'Finanzas', ruta: '/finanzas', codigo: 'FIN', descripcion: 'Balance de Energia, movimientos y reportes', roles: ['comandante'] },
  { nombre: 'Tripulacion', ruta: '/tripulacion', codigo: 'RRHH', descripcion: 'Empleados y rotaciones de turno', roles: ['comandante', 'tripulacion'] },
  { nombre: 'Usuarios', ruta: '/usuarios', codigo: 'USR', descripcion: 'Cuentas de acceso y roles', roles: ['comandante'] }
];
