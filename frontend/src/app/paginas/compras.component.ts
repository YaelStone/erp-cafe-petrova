import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Compra, Proveedor, Producto } from '../modelos';
import { ApiService } from '../servicios/api.service';

// RF-18 a RF-22 Proveedores y Manifiestos de Carga
@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <p class="meta"><span class="punto-rojo"></span>Modulo CMP</p>
    <h2>Manifiestos de Carga</h2>

    <div class="rejilla resumen">
      <div class="tarjeta"><h3>Por pagar</h3><p class="total rojo">{{ porPagar() | currency }}</p></div>
      <div class="tarjeta"><h3>En transito</h3><p class="total">{{ enTransito() }}</p></div>
      <div class="tarjeta"><h3>Proveedores</h3><p class="total">{{ proveedores().length }}</p></div>
    </div>

    <div class="tarjeta">
      <div class="desliza">
        <table>
          <tr>
            <th>Folio</th>
            <th>Proveedor</th>
            <th>Fecha</th>
            <th class="derecha">Total</th>
            <th>Carga</th>
            <th>Pago</th>
            <th></th>
          </tr>
          <tr *ngFor="let c of compras()">
            <td>MC-{{ c.idCompra }}</td>
            <td>{{ c.proveedor }}</td>
            <td>{{ c.fecha }}</td>
            <td class="derecha">{{ c.total | currency }}</td>
            <td>
              <span class="etiqueta" [ngClass]="c.estado === 'recibido' ? 'ok' : 'azul'">{{ c.estado }}</span>
            </td>
            <td>
              <span class="etiqueta" [ngClass]="c.pago === 'pagado' ? 'ok' : 'baja'">{{ c.pago }}</span>
            </td>
            <td class="acciones">
              <button class="fantasma" *ngIf="c.estado !== 'recibido'" (click)="recibir(c)">Recibir</button>
              <button class="fantasma" *ngIf="c.pago !== 'pagado'" (click)="pagar(c)">Pagar</button>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <div class="columnas">
      <div class="tarjeta">
        <h3>Nuevo manifiesto</h3>
        <div class="formulario">
          <select [(ngModel)]="idProveedor">
            <option *ngFor="let p of proveedores()" [ngValue]="p.idProveedor">{{ p.nombre }}</option>
          </select>
        </div>
        <div class="formulario">
          <select [(ngModel)]="linea.idProducto">
            <option *ngFor="let p of productos()" [ngValue]="p.idProducto">{{ p.nombre }}</option>
          </select>
          <input type="number" [(ngModel)]="linea.cantidad" min="1" placeholder="Cantidad">
          <input type="number" [(ngModel)]="linea.costoUnitario" placeholder="Costo unitario">
          <button class="gris" (click)="agregarLinea()">Agregar</button>
        </div>
        <table *ngIf="lineas.length">
          <tr><th>Producto</th><th>Cant.</th><th class="derecha">Importe</th></tr>
          <tr *ngFor="let l of lineas">
            <td>{{ nombreProducto(l.idProducto) }}</td>
            <td>{{ l.cantidad }}</td>
            <td class="derecha">{{ l.cantidad * l.costoUnitario | currency }}</td>
          </tr>
        </table>
        <button (click)="guardarCompra()" [disabled]="!lineas.length">Generar manifiesto</button>
      </div>

      <div class="tarjeta">
        <h3>Proveedores</h3>
        <div class="formulario">
          <input [(ngModel)]="proveedor.nombre" placeholder="Nombre">
          <input [(ngModel)]="proveedor.telefono" placeholder="Telefono">
          <input [(ngModel)]="proveedor.correo" placeholder="Correo">
          <button (click)="guardarProveedor()">Agregar</button>
        </div>
        <table>
          <tr>
            <th>Nombre</th>
            <th>Telefono</th>
            <th>Correo</th>
          </tr>
          <tr *ngFor="let p of proveedores()">
            <td>{{ p.nombre }}</td>
            <td>{{ p.telefono }}</td>
            <td>{{ p.correo }}</td>
          </tr>
        </table>
      </div>
    </div>

    <p class="exito" *ngIf="mensaje()">{{ mensaje() }}</p>
    <p class="aviso" *ngIf="error()">{{ error() }}</p>
  `,
  styles: [`
    .columnas { display: flex; gap: 16px; flex-wrap: wrap; }
    .columnas .tarjeta { flex: 1; min-width: 300px; }
    .acciones { white-space: nowrap; }
    .acciones button { padding: 5px 9px; font-size: 12px; margin-right: 4px; }
  `]
})
export class ComprasComponent implements OnInit {
  private api = inject(ApiService);

  compras = signal<Compra[]>([]);
  proveedores = signal<Proveedor[]>([]);
  productos = signal<Producto[]>([]);
  idProveedor = 1;
  linea: any = { idProducto: 1, cantidad: 1, costoUnitario: null };
  lineas: any[] = [];
  proveedor = { nombre: '', telefono: '', correo: '' };
  mensaje = signal('');
  error = signal('');

  ngOnInit(): void {
    this.cargar();
    this.api.get<any[]>('/productos').subscribe(filas => this.productos.set(filas.map(f => Producto.desdeFila(f))));
  }

  cargar(): void {
    this.api.get<any[]>('/compras').subscribe(filas => this.compras.set(filas.map(f => Compra.desdeFila(f))));
    this.api.get<any[]>('/compras/proveedores').subscribe(filas => this.proveedores.set(filas.map(f => Proveedor.desdeFila(f))));
  }

  porPagar(): number {
    return this.compras().filter(c => c.pago !== 'pagado').reduce((s, c) => s + c.total, 0);
  }

  enTransito(): number {
    return this.compras().filter(c => c.estado !== 'recibido').length;
  }

  nombreProducto(id: number): string {
    return this.productos().find(p => p.idProducto === id)?.nombre || '';
  }

  agregarLinea(): void {
    if (this.linea.cantidad < 1 || !(this.linea.costoUnitario > 0)) {
      this.error.set('Cantidad y costo mayores a cero.');
      return;
    }
    this.error.set('');
    this.lineas.push({ ...this.linea });
    this.linea = { idProducto: this.linea.idProducto, cantidad: 1, costoUnitario: null };
  }

  guardarCompra(): void {
    this.responder(this.api.post('/compras', { idProveedor: this.idProveedor, productos: this.lineas }), () => this.lineas = []);
  }

  // Al recibir, el backend suma los productos al inventario
  recibir(c: Compra): void {
    this.responder(this.api.put('/compras/' + c.idCompra + '/recibir'));
  }

  // Al pagar, el backend registra el egreso en Finanzas
  pagar(c: Compra): void {
    this.responder(this.api.put('/compras/' + c.idCompra + '/pago', { estado: 'pagado' }));
  }

  guardarProveedor(): void {
    if (!this.proveedor.nombre) {
      this.error.set('Escribe el nombre del proveedor.');
      return;
    }
    this.responder(this.api.post('/compras/proveedores', this.proveedor), () => this.proveedor = { nombre: '', telefono: '', correo: '' });
  }

  private responder(peticion: any, despues?: () => void): void {
    this.error.set('');
    peticion.subscribe({
      next: (r: any) => { this.mensaje.set(r.mensaje || 'Manifiesto MC-' + r.id + ' generado por ' + r.total); if (despues) despues(); this.cargar(); },
      error: (e: any) => { this.mensaje.set(''); this.error.set(this.api.mensajeError(e)); }
    });
  }
}
