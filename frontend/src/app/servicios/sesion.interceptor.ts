import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SesionService } from './sesion.service';

// Si el backend dice 401 (sin sesion o vencida) se regresa al login
export const sesionInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const sesion = inject(SesionService);
  return siguiente(peticion).pipe(
    catchError(error => {
      const esLogin = peticion.url.includes('/usuarios/login') || peticion.url.includes('/usuarios/sesion');
      if (error.status === 401 && !esLogin) {
        sesion.olvidar();
      }
      return throwError(() => error);
    })
  );
};
