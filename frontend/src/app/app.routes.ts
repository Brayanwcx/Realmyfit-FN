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
import { ProductoDetalleComponent } from './features/producto-detalle/producto-detalle';
import { CheckoutSuccessComponent } from './features/checkout/checkout-success';
import { CheckoutCancelComponent } from './features/checkout/checkout-cancel';
import { CheckoutPaymentComponent } from './features/checkout/checkout-payment';


// ─── Auth ─────────────────────────────────────────────────────────
import { LoginComponent } from './auth/login/login.component';
import { PerfilComponent } from './auth/perfil/perfil';
import { GoogleCallbackComponent } from './auth/google-callback/google-callback.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password';
import { ResetPasswordComponent } from './auth/reset-password/reset-password';

// ─── Admin (feature) ──────────────────────────────────────────────
import { AdminComponent } from './features/admin/admin';
import { AdminDashboardComponent } from './features/admin/dashboard';
import { AdminUsersComponent } from './features/admin/users';
import { AdminProductsComponent } from './features/admin/products';
import { AdminTrainersComponent } from './features/admin/trainers';
import { AdminEventsComponent } from './features/admin/events';
import { AdminEventRegistrationsComponent } from './features/admin/event-registrations';
import { AdminContactsComponent } from './features/admin/contacts';
import { AdminMembershipsComponent } from './features/admin/memberships';
import { AdminReviewsComponent } from './features/admin/reviews';
import { AdminOrdersComponent } from './features/admin/orders';
import { AdminMachinesComponent } from './features/admin/machines';
import { AdminCategoriesComponent } from './features/admin/categories/categories.component';
import { AdminSettingsComponent } from './features/admin/settings/settings';

export const routes: Routes = [
  // ─── Públicas ──────────────────────────────────────────────────
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/google-callback', component: GoogleCallbackComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'productos', component: ProductosComponent },
  { path: 'productos/:id', component: ProductoDetalleComponent },
  { path: 'entrenadores', component: EntrenadoresComponent },
  { path: 'maquinas', component: MaquinasComponent },
  { path: 'membresias', component: MembresiasComponent },
  { path: 'eventos', component: EventosComponent },
  { path: 'cart', component: CartComponent },
  { path: 'resenas', component: Resenas },
  { path: 'contacto', component: Contacto },
  { path: 'ficha-tecnica', component: MaquinaDetalle },
  { path: 'inscripcion', component: EventoInscripcion },
  { path: 'checkout/success', component: CheckoutSuccessComponent },
  { path: 'checkout/cancel', component: CheckoutCancelComponent },
  { path: 'checkout/pay', component: CheckoutPaymentComponent },

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
      { path: 'trainers', component: AdminTrainersComponent },
      { path: 'products', component: AdminProductsComponent },
      { path: 'categories', component: AdminCategoriesComponent },
      { path: 'settings', component: AdminSettingsComponent },
      { path: 'memberships', component: AdminMembershipsComponent },
      { path: 'reviews', component: AdminReviewsComponent },
      { path: 'orders', component: AdminOrdersComponent },
      { path: 'machines', component: AdminMachinesComponent },
      { path: 'events', component: AdminEventsComponent },
      { path: 'event-registrations', component: AdminEventRegistrationsComponent },
      { path: 'contacts', component: AdminContactsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // ─── Fallback ──────────────────────────────────────────────────
  { path: '**', redirectTo: '' }
];
