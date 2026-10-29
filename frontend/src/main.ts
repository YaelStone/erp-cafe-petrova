import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { rutas } from './app/app.routes';
import { sesionInterceptor } from './app/servicios/sesion.interceptor';

// Arranque de la aplicacion sin NgModule
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(rutas),
    provideHttpClient(withInterceptors([sesionInterceptor]))
  ]
});
