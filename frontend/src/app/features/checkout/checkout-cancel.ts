import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-checkout-cancel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="checkout-result-page">
      <div class="result-card glass">
        <div class="result-icon cancel-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h1>Pago cancelado</h1>
        <p class="result-message">
          Tu pago fue cancelado. No se realizó ningún cargo. Puedes volver al carrito e intentar de nuevo cuando quieras.
        </p>
        <div class="result-actions">
          <a routerLink="/cart" class="btn-primary">Volver al carrito</a>
          <a routerLink="/" class="btn-outline">Ir al inicio</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .checkout-result-page {
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .result-card {
      max-width: 500px;
      width: 100%;
      text-align: center;
      padding: 3rem 2rem;
      border-radius: 16px;
    }
    .result-icon {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }
    .cancel-icon {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }
    h1 { font-size: 1.75rem; margin-bottom: 0.75rem; }
    .result-message { color: var(--text-muted, #aaa); margin-bottom: 1.5rem; line-height: 1.6; }
    .result-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .btn-outline {
      padding: 0.6rem 1.5rem;
      border: 1px solid currentColor;
      border-radius: 8px;
      text-decoration: none;
      color: inherit;
      transition: background 0.2s;
    }
    .btn-outline:hover { background: rgba(255,255,255,0.08); }
  `]
})
export class CheckoutCancelComponent {}
