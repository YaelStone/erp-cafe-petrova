import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from './sesion.service';

// Sin sesion no se entra a ninguna pantalla del ERP
export const sesionGuard: CanActivateFn = async () => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  return (await sesion.cargar()) ? true : router.parseUrl('/login');
};

// Cada rol solo entra a los modulos que tiene en modulos.ts
export const rolGuard: CanActivateFn = async (ruta) => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  await sesion.cargar();
  return sesion.puedeAbrir('/' + ruta.routeConfig?.path) ? true : router.parseUrl('/inicio');
};

// Si ya hay sesion, el login manda directo al inicio
export const invitadoGuard: CanActivateFn = async () => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  return (await sesion.cargar()) ? router.parseUrl('/inicio') : true;
};
