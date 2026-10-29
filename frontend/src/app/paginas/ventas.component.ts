import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Venta, DetalleVenta, Producto, Cliente } from '../modelos';
import { ApiService } from '../servicios/api.service';
import { SesionService } from '../servicios/sesion.service';

declare const paypal: any;

// RF-11 a RF-14 Registrar venta, totales, pago (incluye PayPal) y factura XML por correo
@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <p class="meta"><span class="punto-rojo"></span>Modulo VNT</p>
    <h2>Bitacora de Mision - Nueva venta</h2>

    <div class="columnas">
      <div class="tarjeta">
        <h3>Productos</h3>

        <div class="fila">
          <select [(ngModel)]="idElegido" aria-label="Producto">
            <option *ngFor="let p of productos()" [ngValue]="p.idProducto" [disabled]="p.existencia === 0">
              {{ p.nombre }} - {{ p.precio | currency }} ({{ p.existencia }})
            </option>
          </select>
          <input type="number" [(ngModel)]="cantidad" min="1" aria-label="Cantidad">
          <button (click)="agregar()">Agregar</button>
        </div>

        <table>
          <tr>
            <th>Producto</th>
            <th>Cant.</th>
            <th class="derecha">Importe</th>
            <th></th>
          </tr>
          <tr *ngFor="let d of venta.detalles; let i = index">
            <td>{{ d.nombre }}</td>
            <td>{{ d.cantidad }}</td>
            <td class="derecha">{{ d.importe() | currency }}</td>
            <td><button class="gris" (click)="quitar(i)">Quitar</button></td>
          </tr>
        </table>

        <p class="aviso" *ngIf="venta.detalles.length === 0">Agrega productos para iniciar la venta.</p>
      </div>

      <div class="tarjeta">
        <h3>Cobro</h3>

        <div class="campo">
          <label>Cliente Amaze (para puntos y factura)</label>
          <select [(ngModel)]="venta.idCliente">
            <option [ngValue]="null">Publico en general</option>
            <option *ngFor="let c of clientes()" [ngValue]="c.idCliente">{{ c.nombre }} - {{ c.correo }}</option>
          </select>
        </div>

        <p class="renglon">Subtotal <span>{{ venta.subtotal() | currency }}</span></p>
        <p class="renglon">IVA 16% <span>{{ venta.iva() | currency }}</span></p>
        <p class="total">Total {{ venta.calcularTotal() | currency }}</p>

        <div class="campo">
          <label>Forma de pago</label>
          <select [(ngModel)]="venta.formaPago" (ngModelChange)="cambioFormaPago($event)">
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
            <option value="paypal">PayPal</option>
          </select>
        </div>

        <div class="campo" *ngIf="venta.formaPago === 'efectivo'">
          <label>Recibido</label>
          <input type="number" [(ngModel)]="recibido">
          <p>Cambio: {{ cambio() | currency }}</p>
        </div>

        <button *ngIf="venta.formaPago !== 'paypal'" (click)="cobrar()" [disabled]="cobrando()">Cobrar</button>

        <div *ngIf="venta.formaPago === 'paypal'">
          <p class="aviso" *ngIf="!paypalListo()">{{ estadoPaypal() }}</p>
          <div id="paypal-botones" class="paypal-caja"></div>
        </div>

        <p class="exito" *ngIf="mensaje()">{{ mensaje() }}</p>
        <p class="aviso" *ngIf="error()">{{ error() }}</p>
      </div>
    </div>

    <div class="tarjeta">
      <div class="cabecera">
        <h3>Ventas registradas</h3>
        <span class="meta">Corte de hoy: {{ corte().tickets }} tickets · {{ corte().total_vendido | currency }}</span>
      </div>
      <div class="desliza">
        <table>
          <tr>
            <th>Folio</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Pago</th>
            <th class="derecha">Total</th>
            <th>Factura</th>
          </tr>
          <tr *ngFor="let v of ventas()">
            <td>PL-{{ v.id_venta }}</td>
            <td>{{ v.fecha }}</td>
            <td>{{ v.cliente || 'Publico en general' }}</td>
            <td><span class="etiqueta" [ngClass]="v.forma_pago === 'paypal' ? 'azul' : 'ok'">{{ v.forma_pago }}</span></td>
            <td class="derecha">{{ v.total | currency }}</td>
            <td class="acciones">
              <button class="fantasma" (click)="descargarXml(v.id_venta)">XML</button>
              <button class="fantasma" (click)="enviarCorreo(v)" [disabled]="!v.correo_cliente">Enviar</button>
              <button class="fantasma peligro" *ngIf="esComandante()" (click)="cancelar(v.id_venta)">Cancelar</button>
            </td>
          </tr>
        </table>
      </div>
      <p class="exito" *ngIf="mensajeFactura()">{{ mensajeFactura() }} <a *ngIf="vistaCorreo()" [href]="vistaCorreo()" target="_blank" rel="noopener">Ver correo</a></p>
    </div>
  `,
  styles: [`
    .columnas { display: flex; gap: 16px; flex-wrap: wrap; }
    .columnas .tarjeta { flex: 1; min-width: 300px; }
    .fila { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
    .fila select { flex: 1; min-width: 160px; }
    .fila input { width: 70px; }
    .renglon { display: flex; justify-content: space-between; margin: 4px 0; }
    .cabecera { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; }
    .acciones { white-space: nowrap; }
    .acciones button { padding: 5px 9px; font-size: 12px; margin-right: 4px; }
    .paypal-caja { background: #fff; border-radius: 14px; padding: 12px 12px 4px; margin-top: 8px; }
    .paypal-caja:empty { display: none; }
  `]
})
export class VentasComponent implements OnInit {
  private api = inject(ApiService);
  private sesion = inject(SesionService);

  productos = signal<Producto[]>([]);
  clientes = signal<Cliente[]>([]);
  ventas = signal<any[]>([]);
  corte = signal<any>({ tickets: 0, total_vendido: 0 });

  venta = new Venta(0, new Date().toLocaleString());
  idElegido = 0;
  cantidad = 1;
  recibido = 0;
  mensaje = signal('');
  error = signal('');
  cobrando = signal(false);
  mensajeFactura = signal('');
  vistaCorreo = signal<string | null>(null);

  paypalListo = signal(false);
  estadoPaypal = signal('Cargando PayPal...');

  ngOnInit(): void {
    this.cargar();
    this.api.get<any[]>('/clientes').subscribe(filas => this.clientes.set(filas.map(f => Cliente.desdeFila(f))));
  }

  cargar(): void {
    this.api.get<any[]>('/productos').subscribe(filas => {
      this.productos.set(filas.map(f => Producto.desdeFila(f)));
      if (!this.idElegido && filas.length) this.idElegido = filas[0].id_producto;
    });
    this.api.get<any[]>('/ventas').subscribe(filas => this.ventas.set(filas));
    this.api.get('/ventas/corte').subscribe(c => this.corte.set(c));
  }

  esComandante(): boolean {
    return this.sesion.usuario()?.rol === 'comandante';
  }

  agregar(): void {
    const p = this.productos().find(x => x.idProducto === this.idElegido);
    if (!p || this.cantidad < 1) return;
    const yaHay = this.venta.detalles.filter(d => d.idProducto === p.idProducto).reduce((s, d) => s + d.cantidad, 0);
    if (yaHay + this.cantidad > p.existencia) {
      this.error.set('Solo quedan ' + p.existencia + ' de ' + p.nombre);
      return;
    }
    this.error.set('');
    this.venta.detalles.push(new DetalleVenta(p.idProducto, p.nombre, this.cantidad, p.precio));
    this.cantidad = 1;
  }

  quitar(i: number): void {
    this.venta.detalles.splice(i, 1);
  }

  cambio(): number {
    const c = this.recibido - this.venta.calcularTotal();
    return c > 0 ? c : 0;
  }

  cobrar(): void {
    if (this.venta.detalles.length === 0) {
      this.error.set('No hay productos en la venta.');
      return;
    }
    if (this.venta.formaPago === 'efectivo' && this.recibido < this.venta.calcularTotal()) {
      this.error.set('El efectivo recibido no alcanza.');
      return;
    }
    this.cobrando.set(true);
    this.api.post('/ventas', this.venta.paraEnviar()).subscribe({
      next: r => this.ventaGuardada(r),
      error: e => { this.error.set(this.api.mensajeError(e)); this.cobrando.set(false); }
    });
  }

  private ventaGuardada(r: any): void {
    this.mensaje.set('Venta guardada con folio PL-' + r.id + ' por ' + Number(r.total).toFixed(2) + ' MXN');
    this.error.set('');
    this.cobrando.set(false);
    this.venta = new Venta(0, new Date().toLocaleString());
    this.recibido = 0;
    this.paypalListo.set(false);
    this.cargar();
  }

  // ---------- PayPal ----------
  cambioFormaPago(forma: string): void {
    if (forma === 'paypal') setTimeout(() => this.montarPaypal());
  }

  private async montarPaypal(): Promise<void> {
    const config = await firstValueFrom(this.api.get<any>('/paypal/config'));
    if (!config.clientId) {
      this.estadoPaypal.set('PayPal no esta configurado: falta PAYPAL_CLIENT_ID en el .env del backend.');
      return;
    }
    await this.cargarSdk(config.clientId, config.moneda);
    const caja = document.getElementById('paypal-botones');
    if (!caja) return;
    caja.innerHTML = '';

    paypal.Buttons({
      style: { layout: 'vertical', color: 'black', shape: 'pill', label: 'pay' },
      createOrder: async () => {
        if (this.venta.detalles.length === 0) throw new Error('Venta vacia');
        const orden = await firstValueFrom(this.api.post<any>('/paypal/orden', this.venta.paraEnviar()));
        return orden.id;
      },
      onApprove: async (datos: any) => {
        try {
          const r = await firstValueFrom(this.api.post('/paypal/captura', { ...this.venta.paraEnviar(), idOrden: datos.orderID }));
          this.ventaGuardada(r);
          this.venta.formaPago = 'paypal';
          setTimeout(() => this.montarPaypal());
        } catch (e) {
          this.error.set(this.api.mensajeError(e));
        }
      },
      onError: () => this.error.set('PayPal no pudo procesar el pago.')
    }).render('#paypal-botones');
    this.paypalListo.set(true);
  }

  // Carga el SDK de PayPal una sola vez
  private cargarSdk(clientId: string, moneda: string): Promise<void> {
    if ((window as any).paypal) return Promise.resolve();
    return new Promise((resolver, rechazar) => {
      const script = document.createElement('script');
      script.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(clientId) + '&currency=' + moneda;
      script.onload = () => resolver();
      script.onerror = () => { this.estadoPaypal.set('No se pudo cargar PayPal.'); rechazar(); };
      document.body.appendChild(script);
    });
  }

  // ---------- Factura ----------
  descargarXml(id: number): void {
    this.api.descargar('/ventas/' + id + '/xml', 'factura-PL-' + id + '.xml');
  }

  enviarCorreo(v: any): void {
    this.mensajeFactura.set('Enviando factura PL-' + v.id_venta + '...');
    this.vistaCorreo.set(null);
    this.api.post<any>('/ventas/' + v.id_venta + '/enviar').subscribe({
      next: r => { this.mensajeFactura.set(r.mensaje); this.vistaCorreo.set(r.vistaPrevia); },
      error: e => this.mensajeFactura.set(this.api.mensajeError(e))
    });
  }

  cancelar(id: number): void {
    if (!confirm('Cancelar la venta PL-' + id + '? Se regresa la existencia.')) return;
    this.api.delete('/ventas/' + id).subscribe(() => this.cargar());
  }
}
