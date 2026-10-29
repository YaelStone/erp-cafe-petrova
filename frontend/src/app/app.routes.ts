import { Routes } from '@angular/router';
import { LoginComponent } from './paginas/login.component';
import { InicioComponent } from './paginas/inicio.component';
import { VentasComponent } from './paginas/ventas.component';
import { ClientesComponent } from './paginas/clientes.component';
import { InventarioComponent } from './paginas/inventario.component';
import { ComprasComponent } from './paginas/compras.component';
import { FinanzasComponent } from './paginas/finanzas.component';
import { TripulacionComponent } from './paginas/tripulacion.component';
import { UsuariosComponent } from './paginas/usuarios.component';
import { sesionGuard, rolGuard, invitadoGuard } from './servicios/guards';

// Aqui se agregan o quitan pantallas. Los roles de cada una estan en modulos.ts
export const rutas: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [invitadoGuard] },
  { path: 'inicio', component: InicioComponent, canActivate: [sesionGuard] },
  { path: 'ventas', component: VentasComponent, canActivate: [sesionGuard, rolGuard] },
  { path: 'clientes', component: ClientesComponent, canActivate: [sesionGuard, rolGuard] },
  { path: 'inventario', component: InventarioComponent, canActivate: [sesionGuard, rolGuard] },
  { path: 'compras', component: ComprasComponent, canActivate: [sesionGuard, rolGuard] },
  { path: 'finanzas', component: FinanzasComponent, canActivate: [sesionGuard, rolGuard] },
  { path: 'tripulacion', component: TripulacionComponent, canActivate: [sesionGuard, rolGuard] },
  { path: 'usuarios', component: UsuariosComponent, canActivate: [sesionGuard, rolGuard] },
  { path: '**', redirectTo: 'login' }
];
