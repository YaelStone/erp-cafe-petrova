import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario, Empleado } from '../modelos';
import { ApiService } from '../servicios/api.service';
import { SesionService } from '../servicios/sesion.service';

// RF-02 Gestion de usuarios
@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <p class="meta"><span class="punto-rojo"></span>Modulo USR</p>
    <h2>Usuarios</h2>

    <div class="tarjeta">
      <h3>Nuevo usuario</h3>
      <div class="formulario">
        <select [(ngModel)]="forma.idEmpleado">
          <option *ngFor="let e of empleados()" [ngValue]="e.idEmpleado">{{ e.nombre }}</option>
        </select>
        <input [(ngModel)]="forma.correo" type="email" placeholder="correo@petrova.com">
        <input [(ngModel)]="forma.contrasena" type="password" placeholder="Contrasena (8 o mas)">
        <select [(ngModel)]="forma.rol">
          <option value="comandante">Comandante</option>
          <option value="cajero">Cajero</option>
          <option value="almacenista">Almacenista</option>
          <option value="tripulacion">Tripulacion</option>
        </select>
        <button (click)="guardar()">Guardar</button>
      </div>
      <p class="gris">La contrasena se guarda cifrada con bcrypt; nadie la puede leer.</p>
      <p class="exito" *ngIf="mensaje()">{{ mensaje() }}</p>
      <p class="aviso" *ngIf="error()">{{ error() }}</p>
    </div>

    <div class="tarjeta">
      <div class="desliza">
        <table>
          <tr>
            <th>Correo</th>
            <th>Tripulante</th>
            <th>Rol</th>
            <th>Estado</th>
            <th></th>
          </tr>
          <tr *ngFor="let u of usuarios()">
            <td>{{ u.correo }}</td>
            <td>{{ u.nombre }}</td>
            <td>{{ u.rol }}</td>
            <td>
              <span class="etiqueta" [ngClass]="u.activo ? 'ok' : 'mala'">
                {{ u.activo ? 'Activo' : 'Desactivado' }}
              </span>
            </td>
            <td class="acciones">
              <button class="fantasma" (click)="cambiarEstado(u)" [disabled]="esYo(u)">
                {{ u.activo ? 'Desactivar' : 'Activar' }}
              </button>
              <button class="fantasma peligro" (click)="borrar(u)" [disabled]="esYo(u)">Borrar</button>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .acciones { white-space: nowrap; }
    .acciones button { padding: 5px 9px; font-size: 12px; margin-right: 4px; }
    .gris { color: var(--gris); font-size: 12px; }
  `]
})
export class UsuariosComponent implements OnInit {
  private api = inject(ApiService);
  private sesion = inject(SesionService);

  usuarios = signal<Usuario[]>([]);
  empleados = signal<Empleado[]>([]);
  forma = { idEmpleado: 1, correo: '', contrasena: '', rol: 'cajero' };
  mensaje = signal('');
  error = signal('');

  ngOnInit(): void {
    this.cargar();
    this.api.get<any[]>('/empleados').subscribe(filas => this.empleados.set(filas.map(f => Empleado.desdeFila(f))));
  }

  cargar(): void {
    this.api.get<any[]>('/usuarios').subscribe(filas => this.usuarios.set(filas.map(f => Usuario.desdeFila(f))));
  }

  esYo(u: Usuario): boolean {
    return u.idUsuario === this.sesion.usuario()?.id;
  }

  guardar(): void {
    if (this.forma.contrasena.length < 8) {
      this.error.set('La contrasena debe tener 8 caracteres o mas.');
      return;
    }
    this.responder(this.api.post('/usuarios', this.forma), () => this.forma = { ...this.forma, correo: '', contrasena: '' });
  }

  cambiarEstado(u: Usuario): void {
    this.responder(this.api.put('/usuarios/' + u.idUsuario + '/estado', { activo: !u.activo }));
  }

  borrar(u: Usuario): void {
    if (!confirm('Borrar el usuario ' + u.correo + '?')) return;
    this.responder(this.api.delete('/usuarios/' + u.idUsuario));
  }

  private responder(peticion: any, despues?: () => void): void {
    this.error.set('');
    peticion.subscribe({
      next: (r: any) => { this.mensaje.set(r.mensaje); if (despues) despues(); this.cargar(); },
      error: (e: any) => { this.mensaje.set(''); this.error.set(this.api.mensajeError(e)); }
    });
  }
}
