import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { SesionService } from './servicios/sesion.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="barra" *ngIf="!esLogin() && sesion.usuario() as u">
      <a class="barra-titulo" routerLink="/inicio">
        <span class="planeta" aria-hidden="true"></span>
        Petrova Line
      </a>
      <span class="barra-usuario">
        <span class="punto-rojo"></span>{{ u.nombre }} · {{ u.rol }}
        <button class="fantasma" (click)="sesion.salir()">Salir</button>
      </span>
    </header>

    <nav class="menu" *ngIf="!esLogin() && sesion.usuario()">
      <a routerLink="/inicio" routerLinkActive="activo">Inicio</a>
      <a *ngFor="let m of sesion.modulos()" [routerLink]="m.ruta" routerLinkActive="activo">{{ m.nombre }}</a>
    </nav>

    <main class="contenido">
      <router-outlet></router-outlet>
    </main>
  `
})
export class AppComponent {
  sesion = inject(SesionService);
  private router = inject(Router);

  // El login no lleva barra ni menu
  esLogin(): boolean {
    return this.router.url === '/' || this.router.url.startsWith('/login');
  }
}
