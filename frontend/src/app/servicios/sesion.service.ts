import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { MODULOS, Modulo } from '../modulos';

export interface UsuarioSesion {
  id: number;
  idEmpleado: number;
  correo: string;
  rol: string;
  nombre: string;
}

// Guarda quien esta conectado. El token vive en una cookie httpOnly que Angular no puede leer
@Injectable({ providedIn: 'root' })
export class SesionService {
  private api = inject(ApiService);
  private router = inject(Router);
  private revisada = false;

  usuario = signal<UsuarioSesion | null>(null);

  // Modulos que puede abrir el rol actual (sale de modulos.ts)
  modulos = computed<Modulo[]>(() => {
    const u = this.usuario();
    return u ? MODULOS.filter(m => m.roles.includes(u.rol)) : [];
  });

  async entrar(correo: string, contrasena: string): Promise<void> {
    const u = await firstValueFrom(this.api.post<UsuarioSesion>('/usuarios/login', { correo, contrasena }));
    this.usuario.set(u);
    this.revisada = true;
  }

  // Al recargar la pagina se pregunta al backend si la cookie sigue valida
  async cargar(): Promise<UsuarioSesion | null> {
    if (this.revisada) return this.usuario();
    try {
      this.usuario.set(await firstValueFrom(this.api.get<UsuarioSesion>('/usuarios/sesion')));
    } catch {
      this.usuario.set(null);
    }
    this.revisada = true;
    return this.usuario();
  }

  puedeAbrir(ruta: string): boolean {
    return this.modulos().some(m => m.ruta === ruta);
  }

  salir(): void {
    this.api.post('/usuarios/logout').subscribe();
    this.olvidar();
  }

  // Se usa tambien cuando el backend responde 401
  olvidar(): void {
    this.usuario.set(null);
    this.router.navigate(['/login']);
  }
}
