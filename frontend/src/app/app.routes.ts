import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';

// ─── Features ────────────────────────────────────────────────────
import { HomeComponent } from './features/home/home';
import { ProductosComponent } from './features/productos/productos';
import { EntrenadoresComponent } from './features/entrenadores/entrenadores';
import { MaquinasComponent } from './features/maquinas/maquinas';
import { MembresiasComponent } from './features/membresias/membresias';
import { CartComponent } from './features/cart/cart';
import { EventosComponent } from './features/eventos/eventos';
import { Resenas } from './features/resenas/resenas';
import { Contacto } from './features/contacto/contacto';
import { MaquinaDetalle } from './features/maquina-detalle/maquina-detalle';
import { EventoInscripcion } from './features/evento-inscripcion/evento-inscripcion';

// ─── Auth ─────────────────────────────────────────────────────────
import { LoginComponent } from './auth/login/login.component';
import { PerfilComponent } from './auth/perfil/perfil';

// ─── Admin (feature) ──────────────────────────────────────────────
import { AdminComponent } from './features/admin/admin';
import { AdminDashboardComponent } from './features/admin/dashboard';
import { AdminUsersComponent } from './features/admin/users';
import { AdminProductsComponent } from './features/admin/products';
import { AdminPlaceholderComponent } from './features/admin/placeholder';
import { AdminMembershipsComponent } from './features/admin/memberships';
import { AdminReviewsComponent } from './features/admin/reviews';

export const routes: Routes = [
  // ─── Públicas ──────────────────────────────────────────────────
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'productos', component: ProductosComponent },
  { path: 'entrenadores', component: EntrenadoresComponent },
  { path: 'maquinas', component: MaquinasComponent },
  { path: 'membresias', component: MembresiasComponent },
  { path: 'eventos', component: EventosComponent },
  { path: 'cart', component: CartComponent },
  { path: 'resenas', component: Resenas },
  { path: 'contacto', component: Contacto },
  { path: 'ficha-tecnica', component: MaquinaDetalle },
  { path: 'inscripcion', component: EventoInscripcion },

  // ─── Rutas protegidas (requieren autenticación) ────────────────
  {
    path: 'perfil',
    component: PerfilComponent,
    canActivate: [authGuard]
  },

  // ─── Admin (requiere rol ADMIN) ────────────────────────────────
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [adminGuard],
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'products', component: AdminProductsComponent },
      { path: 'memberships', component: AdminMembershipsComponent },
      { path: 'events', component: AdminPlaceholderComponent },
      { path: 'reviews', component: AdminReviewsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // ─── Fallback ──────────────────────────────────────────────────
  { path: '**', redirectTo: '' }
];
