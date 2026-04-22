import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
  },
  {
    path: 'productos',
    loadComponent: () =>
      import('./components/productos/productos').then(
        (m) => m.ProductosComponent,
      ),
  },
  {
    path: 'entrenadores',
    loadComponent: () =>
      import('./components/entrenadores/entrenadores').then(
        (m) => m.EntrenadoresComponent,
      ),
  },
  {
    path: 'maquinas',
    loadComponent: () =>
      import('./components/maquinas/maquinas').then((m) => m.MaquinasComponent),
  },
  {
    path: 'membresias',
    loadComponent: () =>
      import('./components/membresias/membresias').then(
        (m) => m.MembresiasComponent,
      ),
  },
  {
    path: 'eventos',
    loadComponent: () =>
      import('./components/eventos/eventos').then((m) => m.EventosComponent),
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./components/cart/cart').then((m) => m.CartComponent),
  },
  {
    path: 'resenas',
    loadComponent: () =>
      import('./components/resenas/resenas').then((m) => m.Resenas),
  },
  {
    path: 'contacto',
    loadComponent: () =>
      import('./components/contacto/contacto').then((m) => m.Contacto),
  },
  {
    path: 'ficha-tecnica',
    loadComponent: () =>
      import('./components/maquina-detalle/maquina-detalle').then(
        (m) => m.MaquinaDetalle,
      ),
  },
  {
    path: 'inscripcion',
    loadComponent: () =>
      import('./components/evento-inscripcion/evento-inscripcion').then(
        (m) => m.EventoInscripcion,
      ),
  },
  { path: '**', redirectTo: '' }
];
