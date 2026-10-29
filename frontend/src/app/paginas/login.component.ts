import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SesionService } from '../servicios/sesion.service';
import { ApiService } from '../servicios/api.service';

// RF-01 Inicio de sesion
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="caja-login">
      <div class="orbita" aria-hidden="true">
        <span class="planeta-grande"></span>
        <span class="luna"></span>
      </div>

      <div class="tarjeta">
        <p class="meta"><span class="punto-rojo"></span>Consola de mando · ERP</p>
        <h1 class="titulo-matriz">PETROVA<br>LINE</h1>
        <p class="gris">Entra con tu usuario para abrir la consola.</p>

        <p class="aviso" *ngIf="error()">{{ error() }}</p>

        <form (ngSubmit)="entrar()">
          <div class="campo">
            <label for="correo">Usuario</label>
            <input id="correo" name="correo" type="email" [(ngModel)]="usuario" placeholder="comandante@petrova.com" autocomplete="username">
          </div>

          <div class="campo">
            <label for="contra">Contrasena</label>
            <input id="contra" name="contra" type="password" [(ngModel)]="contra" autocomplete="current-password">
          </div>

          <button type="submit" [disabled]="cargando()">{{ cargando() ? 'Conectando...' : 'Entrar' }}</button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .caja-login { max-width: 380px; margin: 60px auto; position: relative; }
    .caja-login input { width: 100%; }
    .caja-login button { width: 100%; margin-top: 6px; }
    .gris { color: var(--gris); margin-top: 0; }
    .titulo-matriz { font: 900 54px/0.9 'Doto', monospace; margin: 10px 0 14px; color: var(--blanco); letter-spacing: 2px; }
    .orbita { position: absolute; right: -120px; top: -80px; width: 170px; height: 170px; border: 1px dashed var(--borde-fuerte); border-radius: 50%; animation: girar 40s linear infinite; z-index: 0; }
    .planeta-grande { position: absolute; inset: 42px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #fff 0 2px, transparent 3px) 0 0 / 7px 7px, radial-gradient(circle at 30% 30%, #3a3a3a, #000 70%); border: 1px solid var(--borde-fuerte); }
    .luna { position: absolute; top: 4px; left: 50%; width: 12px; height: 12px; border-radius: 50%; background: var(--rojo-nothing); box-shadow: 0 0 14px var(--rojo-nothing); }
    .tarjeta { position: relative; z-index: 1; }
    @keyframes girar { to { transform: rotate(360deg); } }
    @media (max-width: 520px) { .orbita { right: -20px; top: -70px; width: 120px; height: 120px; } .planeta-grande { inset: 30px; } }
  `]
})
export class LoginComponent {
  private sesion = inject(SesionService);
  private api = inject(ApiService);
  private router = inject(Router);

  usuario = '';
  contra = '';
  error = signal('');
  cargando = signal(false);

  async entrar(): Promise<void> {
    if (this.usuario === '' || this.contra === '') {
      this.error.set('Escribe usuario y contrasena.');
      return;
    }
    this.error.set('');
    this.cargando.set(true);
    try {
      await this.sesion.entrar(this.usuario, this.contra);
      this.router.navigate(['/inicio']);
    } catch (e) {
      this.error.set(this.api.mensajeError(e));
    }
    this.cargando.set(false);
  }
}
