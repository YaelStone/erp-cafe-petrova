-- Base de datos del ERP Cafe Petrova Line
-- Proyecto final: modulos, seguridad, PayPal y factura XML por correo

DROP DATABASE IF EXISTS petrova_erp;
CREATE DATABASE petrova_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE petrova_erp;

-- Empleados (tripulacion)
CREATE TABLE empleado (
  id_empleado   INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(80) NOT NULL,
  puesto        VARCHAR(40) NOT NULL,
  telefono      VARCHAR(20),
  fecha_ingreso DATE,
  sueldo_hora   DECIMAL(8,2)
);

-- Usuarios del sistema. La contrasena es un hash de bcrypt (60 caracteres)
CREATE TABLE usuario (
  id_usuario  INT AUTO_INCREMENT PRIMARY KEY,
  id_empleado INT,
  correo      VARCHAR(80) NOT NULL UNIQUE,
  contrasena  VARCHAR(60) NOT NULL,
  rol         VARCHAR(20) NOT NULL,
  activo      TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado)
);

-- Productos (Bodega de Combustible)
CREATE TABLE producto (
  id_producto  INT AUTO_INCREMENT PRIMARY KEY,
  codigo       VARCHAR(20) UNIQUE,
  nombre       VARCHAR(80) NOT NULL,
  temperatura  VARCHAR(15),
  kcal         INT,
  precio       DECIMAL(10,2) NOT NULL,
  existencia   INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 0
);

-- Merma
CREATE TABLE merma (
  id_merma    INT AUTO_INCREMENT PRIMARY KEY,
  id_producto INT,
  cantidad    INT,
  motivo      VARCHAR(40),
  fecha       DATE,
  FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);

-- Clientes Amaze. El correo sirve para mandar la factura
CREATE TABLE cliente (
  id_cliente INT AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(80),
  telefono   VARCHAR(20),
  correo     VARCHAR(80),
  puntos     INT NOT NULL DEFAULT 0
);

-- Ventas (Bitacora de Mision)
CREATE TABLE venta (
  id_venta       INT AUTO_INCREMENT PRIMARY KEY,
  id_empleado    INT,
  id_cliente     INT,
  fecha          DATE,
  subtotal       DECIMAL(10,2),
  iva            DECIMAL(10,2),
  total          DECIMAL(10,2),
  forma_pago     VARCHAR(20),
  id_pago_paypal VARCHAR(40),
  FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado),
  FOREIGN KEY (id_cliente)  REFERENCES cliente(id_cliente)
);

CREATE TABLE detalle_venta (
  id_detalle      INT AUTO_INCREMENT PRIMARY KEY,
  id_venta        INT,
  id_producto     INT,
  cantidad        INT,
  precio_unitario DECIMAL(10,2),
  FOREIGN KEY (id_venta)    REFERENCES venta(id_venta),
  FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);

-- Proveedores y compras (Manifiestos de Carga)
CREATE TABLE proveedor (
  id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(80) NOT NULL,
  telefono     VARCHAR(20),
  correo       VARCHAR(80)
);

-- estado: en transito o recibido. pago: pendiente o pagado
CREATE TABLE compra (
  id_compra    INT AUTO_INCREMENT PRIMARY KEY,
  id_proveedor INT,
  fecha        DATE,
  total        DECIMAL(10,2),
  estado       VARCHAR(20),
  pago         VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor)
);

CREATE TABLE detalle_compra (
  id_detalle_compra INT AUTO_INCREMENT PRIMARY KEY,
  id_compra         INT,
  id_producto       INT,
  cantidad          INT,
  costo_unitario    DECIMAL(10,2),
  FOREIGN KEY (id_compra)   REFERENCES compra(id_compra),
  FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);

-- Finanzas (Balance de Energia)
CREATE TABLE movimiento (
  id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
  tipo          VARCHAR(10),
  categoria     VARCHAR(40),
  concepto      VARCHAR(120),
  monto         DECIMAL(10,2),
  fecha         DATE
);

-- Rotaciones de tripulacion
CREATE TABLE rotacion (
  id_rotacion INT AUTO_INCREMENT PRIMARY KEY,
  id_empleado INT,
  dia         VARCHAR(15),
  hora_inicio TIME,
  hora_fin    TIME,
  FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado) ON DELETE CASCADE
);

-- ---------------- Datos de prueba ----------------
INSERT INTO empleado (nombre, puesto, telefono, fecha_ingreso, sueldo_hora) VALUES
('R. Grace', 'Comandante', '3312345678', '2025-01-15', 85.00),
('Ilyukhina Petrova', 'Cajero', '3312345679', '2025-03-01', 55.00),
('Yao Li-Jie', 'Almacenista', '3312345680', '2025-04-10', 58.00),
('Dimitri Voloshin', 'Encargado de tripulacion', '3312345681', '2025-05-20', 62.00),
('Eva Stratt', 'Barista', '3312345682', '2025-07-02', 52.00);

-- Contrasena de los cuatro: petrova123 (guardada con bcrypt)
INSERT INTO usuario (id_empleado, correo, contrasena, rol) VALUES
(1, 'comandante@petrova.com', '$2b$10$R54SbcaPQzJhooC5t/vxe.8.pZTO2SGjWc7CGNC47A4XD8TfcPfZK', 'comandante'),
(2, 'cajero@petrova.com', '$2b$10$R54SbcaPQzJhooC5t/vxe.8.pZTO2SGjWc7CGNC47A4XD8TfcPfZK', 'cajero'),
(3, 'almacen@petrova.com', '$2b$10$R54SbcaPQzJhooC5t/vxe.8.pZTO2SGjWc7CGNC47A4XD8TfcPfZK', 'almacenista'),
(4, 'tripulacion@petrova.com', '$2b$10$R54SbcaPQzJhooC5t/vxe.8.pZTO2SGjWc7CGNC47A4XD8TfcPfZK', 'tripulacion');

INSERT INTO producto (codigo, nombre, temperatura, kcal, precio, existencia, stock_minimo) VALUES
('P-001', 'Astrophage Latte', 'caliente', 220, 62.00, 40, 10),
('P-002', 'Sandwich Beetle', 'solido', 410, 75.00, 12, 6),
('P-003', 'Barra Blip-A', 'solido', 180, 32.00, 20, 8),
('P-004', 'Leche entera 1 L', 'frio', 610, 28.00, 6, 8),
('P-005', 'Pan artesanal', 'solido', 250, 18.00, 12, 6),
('P-006', 'Cold Brew Tau Ceti', 'frio', 15, 58.00, 25, 8),
('P-007', 'Chocolate Eridiano', 'caliente', 310, 55.00, 4, 6),
('P-008', 'Muffin Hail Mary', 'solido', 380, 42.00, 18, 6);

INSERT INTO cliente (nombre, telefono, correo, puntos) VALUES
('Rocky Grace', '3311223344', 'rocky.grace@example.com', 120),
('Dani Lokken', '3319876543', 'dani.lokken@example.com', 540),
('Carl Dubois', '3315550101', 'carl.dubois@example.com', 210);

INSERT INTO proveedor (nombre, telefono, correo) VALUES
('Cafes del Norte', '3344556677', 'ventas.cafesnorte@example.com'),
('Lacteos Tau', '3355667788', 'pedidos.lacteostau@example.com'),
('Panaderia Orbital', '3366778899', 'hola.orbital@example.com');

INSERT INTO compra (id_proveedor, fecha, total, estado, pago) VALUES
(1, CURDATE() - INTERVAL 8 DAY, 3200.00, 'recibido', 'pagado'),
(2, CURDATE() - INTERVAL 3 DAY, 1450.00, 'recibido', 'pendiente'),
(3, CURDATE() - INTERVAL 1 DAY, 640.00, 'en transito', 'pendiente');

INSERT INTO detalle_compra (id_compra, id_producto, cantidad, costo_unitario) VALUES
(1, 1, 80, 40.00),
(2, 4, 50, 29.00),
(3, 5, 40, 9.00),
(3, 8, 10, 28.00);

-- Ventas de la semana para los reportes
INSERT INTO venta (id_empleado, id_cliente, fecha, subtotal, iva, total, forma_pago) VALUES
(2, 1, CURDATE() - INTERVAL 6 DAY, 199.00, 31.84, 230.84, 'efectivo'),
(2, 2, CURDATE() - INTERVAL 5 DAY, 310.00, 49.60, 359.60, 'tarjeta'),
(2, NULL, CURDATE() - INTERVAL 4 DAY, 124.00, 19.84, 143.84, 'efectivo'),
(5, 3, CURDATE() - INTERVAL 3 DAY, 405.00, 64.80, 469.80, 'transferencia'),
(2, 2, CURDATE() - INTERVAL 2 DAY, 254.00, 40.64, 294.64, 'tarjeta'),
(2, 1, CURDATE() - INTERVAL 1 DAY, 186.00, 29.76, 215.76, 'efectivo');

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario) VALUES
(1, 1, 2, 62.00), (1, 2, 1, 75.00),
(2, 1, 3, 62.00), (2, 6, 1, 58.00), (2, 8, 1, 42.00), (2, 5, 1, 24.00),
(3, 1, 2, 62.00),
(4, 2, 3, 75.00), (4, 6, 2, 58.00), (4, 3, 2, 32.00),
(5, 1, 2, 62.00), (5, 7, 1, 55.00), (5, 3, 1, 32.00), (5, 5, 1, 43.00),
(6, 1, 3, 62.00);

INSERT INTO movimiento (tipo, categoria, concepto, monto, fecha) VALUES
('egreso', 'compras', 'Pago manifiesto MC-1', 3200.00, CURDATE() - INTERVAL 8 DAY),
('egreso', 'nomina', 'Pago semanal tripulacion', 2100.00, CURDATE() - INTERVAL 7 DAY),
('ingreso', 'ventas', 'Venta numero 1 (efectivo)', 230.84, CURDATE() - INTERVAL 6 DAY),
('ingreso', 'ventas', 'Venta numero 2 (tarjeta)', 359.60, CURDATE() - INTERVAL 5 DAY),
('ingreso', 'ventas', 'Venta numero 3 (efectivo)', 143.84, CURDATE() - INTERVAL 4 DAY),
('ingreso', 'ventas', 'Venta numero 4 (transferencia)', 469.80, CURDATE() - INTERVAL 3 DAY),
('ingreso', 'ventas', 'Venta numero 5 (tarjeta)', 294.64, CURDATE() - INTERVAL 2 DAY),
('ingreso', 'ventas', 'Venta numero 6 (efectivo)', 215.76, CURDATE() - INTERVAL 1 DAY),
('ingreso', 'eventos', 'Renta del modulo para evento', 3500.00, CURDATE() - INTERVAL 4 DAY),
('egreso', 'servicios', 'Energia del reactor (luz)', 980.00, CURDATE() - INTERVAL 2 DAY);

INSERT INTO rotacion (id_empleado, dia, hora_inicio, hora_fin) VALUES
(2, 'lunes', '08:00:00', '16:00:00'),
(3, 'lunes', '07:00:00', '15:00:00'),
(5, 'martes', '12:00:00', '20:00:00'),
(2, 'miercoles', '08:00:00', '16:00:00');
