import { Routes } from '@angular/router';
import { ListClientComponent } from './pages/list-client/list-client.component';
import { CarDetailsComponent } from './pages/car-details/car-details.component';
import { ROL } from './models/Usuario';
import { roleGuard } from './guards/role.guard';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'catalogo', pathMatch: 'full' },
  {
    path: 'catalogo',
    loadComponent: () =>
      import('./pages/catalogo/catalogo.component').then((m) => m.CatalogoComponent),
  },
  {
    path: 'vehiculos/:id',
    loadComponent: () =>
      import('./pages/vehiculo-detalle/vehiculo-detalle.component').then(
        (m) => m.VehiculoDetalleComponent,
      ),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/registro/registro.component').then((m) => m.RegistroComponent),
  },
  {
    path: 'menu',
    canMatch: [authGuard],
    canActivate: [roleGuard],
    data: {roles: [ROL.ADMINISTRADOR, ROL.VENDEDOR]},
    loadChildren: () =>
      import('./pages/menu/menu.routes').then((m) => m.routes),
  },
  {
    path: 'perfil',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./pages/menu/perfil/perfil.component').then((m) => m.PerfilComponent),
  },
  {
    path: 'tramites',
    canMatch: [authGuard],
    canActivate: [roleGuard],
    data: { roles: [ROL.USUARIO] },
    loadComponent: () =>
      import('./pages/tramites/tramites.component').then((m) => m.TramitesComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
