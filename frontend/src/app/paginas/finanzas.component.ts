import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Movimiento } from '../modelos';
import { ApiService } from '../servicios/api.service';
import { hoyLocal } from '../modelos';

// RF-23 a RF-25 Movimientos, Balance de Energia y reportes
@Component({
  selector: 'app-finanzas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <p class="meta"><span class="punto-rojo"></span>Modulo FIN</p>
    <h2>Balance de Energia</h2>

    <div class="tarjeta filtros">
      <label>Desde <input type="date" [(ngModel)]="desde"></label>
      <label>Hasta <input type="date" [(ngModel)]="hasta"></label>
      <button (click)="cargarBalance()">Calcular</button>
    </div>

    <div class="rejilla resumen">
      <div class="tarjeta">
        <h3>Ingresos</h3>
        <p class="total">{{ balance().ingresos | currency }}</p>
      </div>
      <div class="tarjeta">
        <h3>Egresos</h3>
        <p class="total">{{ balance().egresos | currency }}</p>
      </div>
      <div class="tarjeta">
        <h3>Energia neta</h3>
        <p class="total" [class.rojo]="balance().energiaNeta < 0">{{ balance().energiaNeta | currency }}</p>
      </div>
    </div>

    <div class="columnas">
      <div class="tarjeta">
        <h3>Ventas de los ultimos 7 dias</h3>
        <div class="barras">
          <div class="barra-dia" *ngFor="let d of ventasDia()">
            <span class="valor">{{ d.total | currency:'MXN':'symbol':'1.0-0' }}</span>
            <span class="columna" [style.height.%]="altura(d.total)"></span>
            <span class="dia">{{ d.fecha.slice(5) }}</span>
          </div>
        </div>
      </div>
      <div class="tarjeta">
        <h3>Por forma de pago</h3>
        <table>
          <tr><th>Forma</th><th class="derecha">Tickets</th><th class="derecha">Total</th></tr>
          <tr *ngFor="let f of formasPago()">
            <td>{{ f.forma_pago }}</td>
            <td class="derecha">{{ f.tickets }}</td>
            <td class="derecha">{{ f.total | currency }}</td>
          </tr>
        </table>
        <h3 class="separa">Mas vendidos</h3>
        <table>
          <tr><th>Producto</th><th class="derecha">Cant.</th><th class="derecha">Importe</th></tr>
          <tr *ngFor="let p of masVendidos()">
            <td>{{ p.nombre }}</td>
            <td class="derecha">{{ p.cantidad }}</td>
            <td class="derecha">{{ p.importe | currency }}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="tarjeta">
      <h3>Registrar movimiento</h3>
      <div class="formulario">
        <select [(ngModel)]="nuevo.tipo">
          <option value="ingreso">Ingreso</option>
          <option value="egreso">Egreso</option>
        </select>
        <input [(ngModel)]="nuevo.categoria" placeholder="Categoria">
        <input [(ngModel)]="nuevo.concepto" placeholder="Concepto">
        <input type="number" [(ngModel)]="nuevo.monto" placeholder="Monto">
        <input type="date" [(ngModel)]="nuevo.fecha">
        <button (click)="guardar()">Guardar</button>
      </div>
      <p class="aviso" *ngIf="error()">{{ error() }}</p>
    </div>

    <div class="tarjeta">
      <h3>Movimientos</h3>
      <div class="desliza">
        <table>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Categoria</th>
            <th>Concepto</th>
            <th class="derecha">Monto</th>
          </tr>
          <tr *ngFor="let m of movimientos()">
            <td>{{ m.fecha }}</td>
            <td><span class="etiqueta" [ngClass]="m.tipo === 'ingreso' ? 'ok' : 'mala'">{{ m.tipo }}</span></td>
            <td>{{ m.categoria }}</td>
            <td>{{ m.concepto }}</td>
            <td class="derecha">{{ m.monto | currency }}</td>
          </tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .filtros { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
    .filtros label { margin: 0; }
    .filtros input { display: block; margin-top: 4px; }
    .columnas { display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-start; }
    .columnas .tarjeta { flex: 1; min-width: 300px; }
    .separa { margin-top: 18px; }
    .barras { display: flex; align-items: flex-end; gap: 10px; height: 200px; padding-top: 20px; }
    .barra-dia { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 4px; }
    .columna { width: 100%; max-width: 42px; min-height: 4px; border-radius: 8px 8px 2px 2px;
      background: radial-gradient(circle, var(--rojo-nothing) 1.6px, transparent 2px) 0 0 / 7px 7px; border: 1px solid var(--rojo-nothing); }
    .valor { font: 10px 'Space Mono', monospace; color: var(--gris); }
    .dia { font: 11px 'Space Mono', monospace; color: var(--texto); }
  `]
})
export class FinanzasComponent implements OnInit {
  private api = inject(ApiService);

  movimientos = signal<Movimiento[]>([]);
  balance = signal<any>({ ingresos: 0, egresos: 0, energiaNeta: 0 });
  ventasDia = signal<any[]>([]);
  formasPago = signal<any[]>([]);
  masVendidos = signal<any[]>([]);
  desde = '';
  hasta = '';
  nuevo = { tipo: 'egreso', categoria: '', concepto: '', monto: null as number | null, fecha: hoyLocal() };
  error = signal('');

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api.get<any[]>('/finanzas/movimientos').subscribe(filas => this.movimientos.set(filas.map(f => Movimiento.desdeFila(f))));
    this.api.get<any[]>('/finanzas/ventas-por-dia').subscribe(d => this.ventasDia.set(d));
    this.api.get<any[]>('/finanzas/formas-pago').subscribe(d => this.formasPago.set(d));
    this.api.get<any[]>('/finanzas/mas-vendidos').subscribe(d => this.masVendidos.set(d));
    this.cargarBalance();
  }

  cargarBalance(): void {
    const filtro = '?desde=' + (this.desde || '2000-01-01') + '&hasta=' + (this.hasta || '2999-12-31');
    this.api.get('/finanzas/balance' + filtro).subscribe(b => this.balance.set(b));
  }

  // Altura de cada barra respecto al dia con mas ventas
  altura(total: number): number {
    const maximo = Math.max(...this.ventasDia().map(d => Number(d.total)), 1);
    return Math.max(4, (Number(total) / maximo) * 85);
  }

  guardar(): void {
    this.api.post('/finanzas/movimientos', this.nuevo).subscribe({
      next: () => {
        this.error.set('');
        this.nuevo = { ...this.nuevo, categoria: '', concepto: '', monto: null };
        this.cargar();
      },
      error: e => this.error.set(this.api.mensajeError(e))
    });
  }
}
