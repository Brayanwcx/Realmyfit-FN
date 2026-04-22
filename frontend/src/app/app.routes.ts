import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { LoginComponent } from './components/login/login.component'; 
import { ProductosComponent } from './components/productos/productos';
import { EntrenadoresComponent } from './components/entrenadores/entrenadores';
import { MaquinasComponent } from './components/maquinas/maquinas';
import { MembresiasComponent } from './components/membresias/membresias';
import { CartComponent } from './components/cart/cart';
import { EventosComponent } from './components/eventos/eventos'; // The component TS is eventos.ts
import { AdminDashboardComponent } from './components/admin/dashboard';
import { AdminComponent } from './components/admin/admin';

import { AdminUsersComponent } from './components/admin/users';
import { AdminProductsComponent } from './components/admin/products';
import { AdminPlaceholderComponent } from './components/admin/placeholder';
import { AdminMembershipsComponent } from './components/admin/memberships';

import { Resenas } from './components/resenas/resenas';
import { Contacto } from './components/contacto/contacto';
import { MaquinaDetalle } from './components/maquina-detalle/maquina-detalle';
import { EventoInscripcion } from './components/evento-inscripcion/evento-inscripcion';
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'productos', component: ProductosComponent },
  { path: 'entrenadores', component: EntrenadoresComponent },
  { path: 'maquinas', component: MaquinasComponent },
  { path: 'membresias', component: MembresiasComponent },
  { path: 'eventos', component: EventosComponent },
  { path: 'cart', component: CartComponent },
  { 
    path: 'admin', 
    component: AdminComponent,
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'products', component: AdminProductsComponent },
      { path: 'memberships', component: AdminMembershipsComponent },
      { path: 'events', component: AdminPlaceholderComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: 'resenas', component: Resenas },
  { path: 'contacto', component: Contacto },
  { path: 'ficha-tecnica', component: MaquinaDetalle },
  { path: 'inscripcion', component: EventoInscripcion },
  { path: '**', redirectTo: '' }
];
