import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto } from '../modelos';
import { ApiService } from '../servicios/api.service';

// RF-05 a RF-10 Catalogo, existencias, entradas, merma y alerta de stock minimo
@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <p class="meta"><span class="punto-rojo"></span>Modulo INV</p>
    <h2>Bodega de Combustible</h2>

    <div class="rejilla resumen">
      <div class="tarjeta"><h3>Productos</h3><p class="total">{{ productos().length }}</p></div>
      <div class="tarjeta"><h3>En alerta</h3><p class="total rojo">{{ alertas() }}</p></div>
      <div class="tarjeta"><h3>Valor en bodega</h3><p class="total">{{ valorBodega() | currency }}</p></div>
    </div>

    <div class="tarjeta">
      <div class="desliza">
        <table>
          <tr>
            <th>Codigo</th>
            <th>Producto</th>
            <th>Temperatura</th>
            <th class="derecha">Precio</th>
            <th class="derecha">Existencia</th>
            <th class="derecha">Minimo</th>
            <th>Estado</th>
            <th></th>
          </tr>
          <tr *ngFor="let p of productos()">
            <td>{{ p.codigo }}</td>
            <td>{{ p.nombre }}</td>
            <td>{{ p.temperatura }}</td>
            <td class="derecha">{{ p.precio | currency }}</td>
            <td class="derecha">{{ p.existencia }}</td>
            <td class="derecha">{{ p.stockMinimo }}</td>
            <td>
              <span class="etiqueta" [ngClass]="claseEstado(p)">{{ textoEstado(p) }}</span>
            </td>
            <td class="acciones">
              <button class="fantasma" (click)="editar(p)">Editar</button>
              <button class="fantasma peligro" (click)="borrar(p)">Borrar</button>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <div class="columnas">
      <div class="tarjeta">
        <h3>{{ editando ? 'Editar producto' : 'Alta de producto' }}</h3>
        <div class="formulario">
          <input [(ngModel)]="forma.codigo" placeholder="Codigo (P-009)" [disabled]="!!editando">
          <input [(ngModel)]="forma.nombre" placeholder="Nombre">
          <select [(ngModel)]="forma.temperatura">
            <option value="caliente">Caliente</option>
            <option value="frio">Frio</option>
            <option value="solido">Solido</option>
          </select>
          <input type="number" [(ngModel)]="forma.kcal" placeholder="kcal">
          <input type="number" [(ngModel)]="forma.precio" placeholder="Precio">
          <input type="number" [(ngModel)]="forma.existencia" placeholder="Existencia" [disabled]="!!editando">
          <input type="number" [(ngModel)]="forma.stockMinimo" placeholder="Stock minimo">
          <button (click)="guardar()">{{ editando ? 'Actualizar' : 'Guardar' }}</button>
          <button class="gris" *ngIf="editando" (click)="limpiar()">Cancelar</button>
        </div>
      </div>

      <div class="tarjeta">
        <h3>Entrada o merma</h3>
        <div class="formulario">
          <select [(ngModel)]="idElegido">
            <option *ngFor="let p of productos()" [ngValue]="p.idProducto">{{ p.nombre }}</option>
          </select>
          <input type="number" [(ngModel)]="cantidad" min="1">
          <select [(ngModel)]="motivo">
            <option value="caducidad">Caducidad</option>
            <option value="dano">Dano</option>
            <option value="derrame">Derrame</option>
            <option value="error">Error de preparacion</option>
          </select>
        </div>
        <div class="fila-botones">
          <button (click)="registrarEntrada()">Registrar entrada</button>
          <button class="gris" (click)="registrarMerma()">Registrar merma</button>
        </div>
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
    .fila-botones { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
  `]
})
export class InventarioComponent implements OnInit {
  private api = inject(ApiService);

  productos = signal<Producto[]>([]);
  forma: any = this.formaVacia();
  editando: Producto | null = null;
  idElegido = 1;
  cantidad = 1;
  motivo = 'caducidad';
  mensaje = signal('');
  error = signal('');

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api.get<any[]>('/productos').subscribe(filas => this.productos.set(filas.map(f => Producto.desdeFila(f))));
  }

  formaVacia(): any {
    return { codigo: '', nombre: '', temperatura: 'caliente', kcal: null, precio: null, existencia: 0, stockMinimo: 5 };
  }

  // Producto en alerta cuando la existencia llega al minimo (RF-09)
  enAlerta(p: Producto): boolean {
    return p.existencia <= p.stockMinimo;
  }

  claseEstado(p: Producto): string {
    return this.enAlerta(p) ? 'baja' : 'ok';
  }

  textoEstado(p: Producto): string {
    return this.enAlerta(p) ? 'Stock bajo' : 'En rango';
  }

  alertas(): number {
    return this.productos().filter(p => this.enAlerta(p)).length;
  }

  valorBodega(): number {
    return this.productos().reduce((s, p) => s + p.existencia * p.precio, 0);
  }

  editar(p: Producto): void {
    this.editando = p;
    this.forma = { ...p };
  }

  limpiar(): void {
    this.editando = null;
    this.forma = this.formaVacia();
  }

  guardar(): void {
    if (!this.forma.nombre || !(this.forma.precio > 0) || this.forma.stockMinimo < 0) {
      this.error.set('Nombre y precio mayor a cero.');
      return;
    }
    const peticion = this.editando
      ? this.api.put('/productos/' + this.editando.idProducto, this.forma)
      : this.api.post('/productos', this.forma);
    this.responder(peticion, () => this.limpiar());
  }

  borrar(p: Producto): void {
    if (!confirm('Borrar ' + p.nombre + '?')) return;
    this.responder(this.api.delete('/productos/' + p.idProducto));
  }

  registrarEntrada(): void {
    this.responder(this.api.post('/productos/' + this.idElegido + '/entrada', { cantidad: this.cantidad }));
  }

  registrarMerma(): void {
    const p = this.productos().find(x => x.idProducto === this.idElegido);
    if (!p) return;
    if (this.cantidad > p.existencia) {
      this.error.set('No puedes dar de baja mas de lo que hay.');
      return;
    }
    this.responder(this.api.post('/productos/merma', { idProducto: this.idElegido, cantidad: this.cantidad, motivo: this.motivo }));
  }

  // Muestra el mensaje del backend y recarga la tabla
  private responder(peticion: any, despues?: () => void): void {
    this.error.set('');
    peticion.subscribe({
      next: (r: any) => { this.mensaje.set(r.mensaje); if (despues) despues(); this.cargar(); },
      error: (e: any) => { this.mensaje.set(''); this.error.set(this.api.mensajeError(e)); }
    });
  }
}
