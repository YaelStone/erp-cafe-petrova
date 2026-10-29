import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SesionService } from '../servicios/sesion.service';

// RF-03 Menu principal por rol
@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <p class="meta"><span class="punto-rojo"></span>Bitacora · {{ hoy }}</p>
    <h2>Hola, {{ sesion.usuario()?.nombre }}</h2>
    <p class="gris">Estos son los modulos que tu rol ({{ sesion.usuario()?.rol }}) puede abrir.</p>

    <div class="rejilla">
      <a class="tarjeta modulo" *ngFor="let m of sesion.modulos(); let i = index" [routerLink]="m.ruta">
        <span class="modulo-num">{{ (i + 1).toString().padStart(2, '0') }}</span>
        <span class="modulo-codigo">{{ m.codigo }}</span>
        <h3>{{ m.nombre }}</h3>
        <p>{{ m.descripcion }}</p>
      </a>
    </div>
  `,
  styles: [`
    .modulo { position: relative; min-height: 150px; }
    .modulo-num { font: 12px 'Space Mono', monospace; color: var(--rojo-nothing); }
    .modulo-codigo { position: absolute; right: 16px; top: 10px; font: 900 28px 'Doto', monospace; color: var(--borde-fuerte); }
    .modulo h3 { margin-top: 26px; }
    .modulo p { color: var(--gris); margin: 0; font-size: 13px; }
  `]
})
export class InicioComponent {
  sesion = inject(SesionService);
  hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
}
