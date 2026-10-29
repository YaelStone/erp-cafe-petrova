import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Unico punto de salida hacia el backend. El proxy manda /api al puerto 3200
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = '/api';

  get<T = any>(ruta: string): Observable<T> {
    return this.http.get<T>(this.base + ruta, { withCredentials: true });
  }

  post<T = any>(ruta: string, cuerpo: any = {}): Observable<T> {
    return this.http.post<T>(this.base + ruta, cuerpo, { withCredentials: true });
  }

  put<T = any>(ruta: string, cuerpo: any = {}): Observable<T> {
    return this.http.put<T>(this.base + ruta, cuerpo, { withCredentials: true });
  }

  delete<T = any>(ruta: string): Observable<T> {
    return this.http.delete<T>(this.base + ruta, { withCredentials: true });
  }

  // Descarga un archivo (la factura XML) respetando la cookie de sesion
  descargar(ruta: string, nombre: string): void {
    this.http.get(this.base + ruta, { withCredentials: true, responseType: 'blob' }).subscribe(archivo => {
      const liga = document.createElement('a');
      liga.href = URL.createObjectURL(archivo);
      liga.download = nombre;
      liga.click();
      URL.revokeObjectURL(liga.href);
    });
  }

  // Saca el mensaje de error que manda el backend
  mensajeError(error: any): string {
    return error?.error?.mensaje || 'No se pudo conectar con el servidor';
  }
}
