import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cliente } from '../modelos';
import { ApiService } from '../servicios/api.service';

// RF-15 y RF-16 Programa Amaze: alta, edicion y puntos de clientes
@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <p class="meta"><span class="punto-rojo"></span>Modulo AMZ</p>
    <h2>Programa Amaze</h2>

    <div class="tarjeta">
      <h3>{{ editando ? 'Editar socio' : 'Nuevo socio' }}</h3>
      <div class="formulario">
        <input [(ngModel)]="forma.nombre" placeholder="Nombre">
        <input [(ngModel)]="forma.telefono" placeholder="Telefono" maxlength="10">
        <input [(ngModel)]="forma.correo" type="email" placeholder="Correo para facturas">
        <button (click)="guardar()">{{ editando ? 'Actualizar' : 'Guardar' }}</button>
        <button class="gris" *ngIf="editando" (click)="limpiar()">Cancelar</button>
      </div>
      <p class="aviso" *ngIf="error()">{{ error() }}</p>
      <p class="exito" *ngIf="mensaje()">{{ mensaje() }}</p>
    </div>

    <div class="tarjeta">
      <input class="buscador" [(ngModel)]="filtro" placeholder="Buscar por nombre o telefono">
      <div class="desliza">
        <table>
          <tr>
            <th>Nombre</th>
            <th>Telefono</th>
            <th>Correo</th>
            <th class="derecha">Puntos</th>
            <th>Nivel</th>
            <th></th>
          </tr>
          <tr *ngFor="let c of filtrados()">
            <td>{{ c.nombre }}</td>
            <td>{{ c.telefono }}</td>
            <td>{{ c.correo }}</td>
            <td class="derecha">{{ c.puntos }}</td>
            <td><span class="etiqueta" [ngClass]="c.nivelAmaze() === 'Forte' ? 'ok' : c.nivelAmaze() === 'Mezzo' ? 'azul' : 'baja'">{{ c.nivelAmaze() }}</span></td>
            <td><button class="fantasma" (click)="editar(c)">Editar</button></td>
          </tr>
        </table>
      </div>
    </div>
  `
})
export class ClientesComponent implements OnInit {
  private api = inject(ApiService);

  clientes = signal<Cliente[]>([]);
  forma = { nombre: '', telefono: '', correo: '' };
  editando: Cliente | null = null;
  filtro = '';
  mensaje = signal('');
  error = signal('');

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api.get<any[]>('/clientes').subscribe(filas => this.clientes.set(filas.map(f => Cliente.desdeFila(f))));
  }

  filtrados(): Cliente[] {
    const t = this.filtro.toLowerCase();
    return this.clientes().filter(c => c.nombre.toLowerCase().includes(t) || c.telefono.includes(t));
  }

  editar(c: Cliente): void {
    this.editando = c;
    this.forma = { nombre: c.nombre, telefono: c.telefono, correo: c.correo };
  }

  limpiar(): void {
    this.editando = null;
    this.forma = { nombre: '', telefono: '', correo: '' };
  }

  guardar(): void {
    if (!this.forma.nombre || !/^\d{10}$/.test(this.forma.telefono) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.forma.correo)) {
      this.error.set('Nombre, telefono de 10 digitos y correo valido.');
      return;
    }
    this.error.set('');
    const peticion = this.editando
      ? this.api.put('/clientes/' + this.editando.idCliente, this.forma)
      : this.api.post('/clientes', this.forma);
    peticion.subscribe({
      next: (r: any) => { this.mensaje.set(r.mensaje); this.limpiar(); this.cargar(); },
      error: e => this.error.set(this.api.mensajeError(e))
    });
  }
}
