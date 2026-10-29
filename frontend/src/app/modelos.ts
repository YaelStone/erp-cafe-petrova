// Clases del diagrama de clases. desdeFila() convierte lo que manda MySQL (snake_case) a la clase.

// Fecha de hoy en horario local (toISOString usa UTC y de noche ya es el dia siguiente)
export function hoyLocal(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export class Usuario {
  constructor(
    public idUsuario: number,
    public correo: string,
    public rol: string,
    public activo: boolean = true,
    public nombre: string = '',
    public idEmpleado: number | null = null
  ) {}

  static desdeFila(f: any): Usuario {
    return new Usuario(f.id_usuario, f.correo, f.rol, !!f.activo, f.nombre || '', f.id_empleado);
  }
}

export class Empleado {
  constructor(
    public idEmpleado: number,
    public nombre: string,
    public puesto: string,
    public telefono: string,
    public sueldoHora: number,
    public fechaIngreso: string = ''
  ) {}

  static desdeFila(f: any): Empleado {
    return new Empleado(f.id_empleado, f.nombre, f.puesto, f.telefono, Number(f.sueldo_hora), f.fecha_ingreso || '');
  }
}

export class Rotacion {
  constructor(
    public idRotacion: number,
    public idEmpleado: number,
    public dia: string,
    public horaInicio: string,
    public horaFin: string,
    public nombre: string = ''
  ) {}

  static desdeFila(f: any): Rotacion {
    return new Rotacion(f.id_rotacion, f.id_empleado, f.dia, f.hora_inicio.slice(0, 5), f.hora_fin.slice(0, 5), f.nombre);
  }
}

export class Cliente {
  constructor(
    public idCliente: number,
    public nombre: string,
    public telefono: string,
    public puntos: number,
    public correo: string = ''
  ) {}

  static desdeFila(f: any): Cliente {
    return new Cliente(f.id_cliente, f.nombre, f.telefono, f.puntos, f.correo || '');
  }

  // Nivel del programa Amaze segun los puntos
  nivelAmaze(): string {
    if (this.puntos >= 500) return 'Forte';
    if (this.puntos >= 200) return 'Mezzo';
    return 'Piano';
  }
}

export class Producto {
  constructor(
    public idProducto: number,
    public nombre: string,
    public temperatura: string,
    public kcal: number,
    public precio: number,
    public existencia: number,
    public stockMinimo: number,
    public codigo: string = ''
  ) {}

  static desdeFila(f: any): Producto {
    return new Producto(f.id_producto, f.nombre, f.temperatura, f.kcal, Number(f.precio), f.existencia, f.stock_minimo, f.codigo);
  }
}

export class Lote {
  constructor(
    public idLote: number,
    public idProducto: number,
    public cantidad: number,
    public fechaCaducidad: string
  ) {}

  descontar(cant: number): void {
    this.cantidad = this.cantidad - cant;
  }
}

export class Merma {
  constructor(
    public idMerma: number,
    public idLote: number,
    public cantidad: number,
    public motivo: string,
    public fecha: string
  ) {}
}

export class DetalleVenta {
  constructor(
    public idProducto: number,
    public nombre: string,
    public cantidad: number,
    public precioUnitario: number
  ) {}

  importe(): number {
    return this.cantidad * this.precioUnitario;
  }
}

export class Venta {
  constructor(
    public idVenta: number,
    public fechaHora: string,
    public detalles: DetalleVenta[] = [],
    public formaPago: string = 'efectivo',
    public idCliente: number | null = null
  ) {}

  subtotal(): number {
    let suma = 0;
    for (const d of this.detalles) {
      suma = suma + d.importe();
    }
    return suma;
  }

  iva(): number {
    return Math.round(this.subtotal() * 0.16 * 100) / 100;
  }

  calcularTotal(): number {
    return this.subtotal() + this.iva();
  }

  // Lo que se manda al backend: solo ids y cantidades, el precio lo pone el servidor
  paraEnviar(): any {
    return {
      idCliente: this.idCliente,
      formaPago: this.formaPago,
      productos: this.detalles.map(d => ({ idProducto: d.idProducto, cantidad: d.cantidad }))
    };
  }
}

export class Proveedor {
  constructor(
    public idProveedor: number,
    public nombre: string,
    public telefono: string,
    public correo: string
  ) {}

  static desdeFila(f: any): Proveedor {
    return new Proveedor(f.id_proveedor, f.nombre, f.telefono, f.correo);
  }
}

export class Compra {
  constructor(
    public idCompra: number,
    public idProveedor: number,
    public proveedor: string,
    public fecha: string,
    public estado: string,
    public total: number,
    public pago: string = 'pendiente'
  ) {}

  static desdeFila(f: any): Compra {
    return new Compra(f.id_compra, f.id_proveedor, f.proveedor, f.fecha, f.estado, Number(f.total), f.pago);
  }
}

export class Movimiento {
  constructor(
    public idMovimiento: number,
    public tipo: string,
    public categoria: string,
    public concepto: string,
    public monto: number,
    public fecha: string
  ) {}

  static desdeFila(f: any): Movimiento {
    return new Movimiento(f.id_movimiento, f.tipo, f.categoria, f.concepto, Number(f.monto), f.fecha);
  }
}
