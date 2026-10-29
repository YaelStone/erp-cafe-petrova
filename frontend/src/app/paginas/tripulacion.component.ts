import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Empleado, Rotacion } from '../modelos';
import { ApiService } from '../servicios/api.service';
import { hoyLocal } from '../modelos';

// RF-26 y RF-27 Expediente de tripulacion y rotaciones (Recursos Humanos)
@Component({
  selector: 'app-tripulacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <p class="meta"><span class="punto-rojo"></span>Modulo RRHH</p>
    <h2>Rotaciones de Tripulacion</h2>

    <div class="rejilla resumen">
      <div class="tarjeta"><h3>Tripulantes</h3><p class="total">{{ empleados().length }}</p></div>
      <div class="tarjeta"><h3>Turnos registrados</h3><p class="total">{{ rotaciones().length }}</p></div>
      <div class="tarjeta"><h3>Nomina semanal estimada</h3><p class="total">{{ nominaSemanal() | currency }}</p></div>
    </div>

    <div class="tarjeta">
      <h3>Tripulacion</h3>
      <div class="desliza">
        <table>
          <tr>
            <th>Nombre</th>
            <th>Puesto</th>
            <th>Telefono</th>
            <th>Ingreso</th>
            <th class="derecha">Sueldo por hora</th>
            <th></th>
          </tr>
          <tr *ngFor="let e of empleados()">
            <td>{{ e.nombre }}</td>
            <td>{{ e.puesto }}</td>
            <td>{{ e.telefono }}</td>
            <td>{{ e.fechaIngreso }}</td>
            <td class="derecha">{{ e.sueldoHora | currency }}</td>
            <td class="acciones">
              <button class="fantasma" (click)="editar(e)">Editar</button>
              <button class="fantasma peligro" (click)="borrar(e)">Baja</button>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <div class="columnas">
      <div class="tarjeta">
        <h3>{{ editando ? 'Editar tripulante' : 'Alta de tripulante' }}</h3>
        <div class="formulario">
          <input [(ngModel)]="forma.nombre" placeholder="Nombre">
          <input [(ngModel)]="forma.puesto" placeholder="Puesto">
          <input [(ngModel)]="forma.telefono" placeholder="Telefono" maxlength="10">
          <input type="date" [(ngModel)]="forma.fechaIngreso" [disabled]="!!editando">
          <input type="number" [(ngModel)]="forma.sueldoHora" placeholder="Sueldo por hora">
          <button (click)="guardar()">{{ editando ? 'Actualizar' : 'Guardar' }}</button>
          <button class="gris" *ngIf="editando" (click)="limpiar()">Cancelar</button>
        </div>
      </div>

      <div class="tarjeta">
        <h3>Asignar rotacion</h3>
        <div class="formulario">
          <select [(ngModel)]="turno.idEmpleado">
            <option *ngFor="let e of empleados()" [ngValue]="e.idEmpleado">{{ e.nombre }}</option>
          </select>
          <select [(ngModel)]="turno.dia">
            <option *ngFor="let d of dias" [value]="d">{{ d }}</option>
          </select>
          <input type="time" [(ngModel)]="turno.horaInicio">
          <input type="time" [(ngModel)]="turno.horaFin">
          <button (click)="guardarTurno()">Asignar</button>
        </div>
      </div>
    </div>

    <p class="exito" *ngIf="mensaje()">{{ mensaje() }}</p>
    <p class="aviso" *ngIf="error()">{{ error() }}</p>

    <div class="tarjeta">
      <h3>Rotaciones</h3>
      <table>
        <tr>
          <th>Empleado</th>
          <th>Dia</th>
          <th>Entrada</th>
          <th>Salida</th>
          <th></th>
        </tr>
        <tr *ngFor="let r of rotaciones()">
          <td>{{ r.nombre }}</td>
          <td>{{ r.dia }}</td>
          <td>{{ r.horaInicio }}</td>
          <td>{{ r.horaFin }}</td>
          <td><button class="fantasma peligro" (click)="borrarTurno(r)">Quitar</button></td>
        </tr>
      </table>
    </div>
  `,
  styles: [`
    .columnas { display: flex; gap: 16px; flex-wrap: wrap; }
    .columnas .tarjeta { flex: 1; min-width: 300px; }
    .acciones { white-space: nowrap; }
    .acciones button, td button { padding: 5px 9px; font-size: 12px; margin-right: 4px; }
  `]
})
export class TripulacionComponent implements OnInit {
  private api = inject(ApiService);

  empleados = signal<Empleado[]>([]);
  rotaciones = signal<Rotacion[]>([]);
  dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  forma: any = this.formaVacia();
  editando: Empleado | null = null;
  turno = { idEmpleado: 1, dia: 'lunes', horaInicio: '08:00', horaFin: '16:00' };
  mensaje = signal('');
  error = signal('');

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api.get<any[]>('/empleados').subscribe(filas => this.empleados.set(filas.map(f => Empleado.desdeFila(f))));
    this.api.get<any[]>('/empleados/rotaciones/lista').subscribe(filas => this.rotaciones.set(filas.map(f => Rotacion.desdeFila(f))));
  }

  formaVacia(): any {
    return { nombre: '', puesto: '', telefono: '', fechaIngreso: hoyLocal(), sueldoHora: null };
  }

  // Horas de cada turno por el sueldo de cada quien
  nominaSemanal(): number {
    let total = 0;
    for (const r of this.rotaciones()) {
      const e = this.empleados().find(x => x.idEmpleado === r.idEmpleado);
      const [h1, m1] = r.horaInicio.split(':').map(Number);
      const [h2, m2] = r.horaFin.split(':').map(Number);
      total = total + ((h2 * 60 + m2 - h1 * 60 - m1) / 60) * (e ? e.sueldoHora : 0);
    }
    return total;
  }

  nombreEmpleado(id: number): string {
    const e = this.empleados().find(x => x.idEmpleado === id);
    return e ? e.nombre : 'Sin asignar';
  }

  editar(e: Empleado): void {
    this.editando = e;
    this.forma = { ...e };
  }

  limpiar(): void {
    this.editando = null;
    this.forma = this.formaVacia();
  }

  guardar(): void {
    if (!this.forma.nombre || !this.forma.puesto || !(this.forma.sueldoHora > 0)) {
      this.error.set('Nombre, puesto y sueldo por hora.');
      return;
    }
    const peticion = this.editando
      ? this.api.put('/empleados/' + this.editando.idEmpleado, this.forma)
      : this.api.post('/empleados', this.forma);
    this.responder(peticion, () => this.limpiar());
  }

  borrar(e: Empleado): void {
    if (!confirm('Dar de baja a ' + e.nombre + '?')) return;
    this.responder(this.api.delete('/empleados/' + e.idEmpleado));
  }

  guardarTurno(): void {
    if (this.turno.horaFin <= this.turno.horaInicio) {
      this.error.set('La salida debe ser despues de la entrada.');
      return;
    }
    this.responder(this.api.post('/empleados/rotaciones', this.turno));
  }

  borrarTurno(r: Rotacion): void {
    this.responder(this.api.delete('/empleados/rotaciones/' + r.idRotacion));
  }

  private responder(peticion: any, despues?: () => void): void {
    this.error.set('');
    peticion.subscribe({
      next: (r: any) => { this.mensaje.set(r.mensaje); if (despues) despues(); this.cargar(); },
      error: (e: any) => { this.mensaje.set(''); this.error.set(this.api.mensajeError(e)); }
    });
  }
}
