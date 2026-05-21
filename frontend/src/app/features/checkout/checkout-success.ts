import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { PaymentService } from '../../core/services/payment.service';

@Component({
  selector: 'app-checkout-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-wrapper">
      <div class="container d-flex justify-content-center">
        <div class="receipt-card glass">
          <div class="receipt-header">
            <div class="icon-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h1>Pago Exitoso</h1>
            <p class="order-id">Orden #{{sessionId.slice(-8).toUpperCase()}}</p>
          </div>

          <div class="receipt-body">
            <div class="receipt-date text-muted">
              <span>Fecha:</span>
              <strong>{{ date | date:'dd/MM/yyyy HH:mm' }}</strong>
            </div>
            
            <div class="divider"></div>
            
            <div class="items-list">
              <div class="receipt-item" *ngFor="let item of purchasedItems">
                <div class="item-info">
                  <span class="qty text-primary">{{item.qty}}x</span>
                  <span class="name text-main">{{item.name}}</span>
                </div>
                <span class="price text-main">{{ formatCurrency(item.price * item.qty) }}</span>
              </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="receipt-total text-muted">
              <span>Subtotal</span>
              <span>{{ formatCurrency(subtotal) }}</span>
            </div>
            
            <div class="receipt-total final">
              <span class="text-main">Total Pagado</span>
              <span class="text-primary">{{ formatCurrency(subtotal) }}</span>
            </div>
          </div>

          <div class="receipt-footer">
            <p class="text-muted">La orden se ha registrado en tu cuenta.</p>
            <div class="actions">
              <a routerLink="/perfil" class="btn-primary w-100 mb-2">Ver mis pedidos</a>
              <a routerLink="/" class="btn-outline w-100">Volver al inicio</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper {
      padding: 6rem 0 2rem;
      background-color: var(--color-bg, #0a0a0a);
      min-height: 100vh;
      display: flex;
      align-items: center;
    }
    .container {
      display: flex;
      justify-content: center;
      padding: 0 1rem;
      width: 100%;
    }
    .receipt-card {
      width: 100%;
      max-width: 500px;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(20, 20, 20, 0.6);
      backdrop-filter: blur(10px);
      overflow: hidden;
    }
    .receipt-header {
      padding: 2rem 2rem 1.5rem;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .icon-circle {
      width: 56px;
      height: 56px;
      background: rgba(var(--color-primary-rgb, 34, 197, 94), 0.15);
      color: var(--color-primary, #22c55e);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 0.8rem;
    }
    .icon-circle svg { width: 32px; height: 32px; }
    h1 {
      margin: 0;
      font-size: 1.5rem;
      color: var(--color-text-main, #fff);
      font-family: var(--font-heading, sans-serif);
      margin-bottom: 0.2rem;
    }
    .order-id {
      color: var(--color-primary, #22c55e);
      font-size: 0.95rem;
      margin: 0;
      font-family: monospace;
      letter-spacing: 1px;
    }
    
    .receipt-body {
      padding: 1.8rem 2rem;
    }
    .text-muted { color: var(--color-text-muted, #aaa); }
    .text-main { color: var(--color-text-main, #fff); }
    .text-primary { color: var(--color-primary, #22c55e); }
    
    .receipt-date {
      display: flex;
      justify-content: space-between;
      font-size: 1rem;
    }
    .divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 1rem 0;
    }
    .receipt-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.8rem;
      font-size: 1rem;
    }
    .qty { width: 32px; display: inline-block; font-weight: bold; }
    .name { font-weight: 500; }
    .price { font-weight: 500; }
    
    .receipt-total {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 1rem;
    }
    .final {
      font-size: 1.3rem;
      font-weight: bold;
      margin-top: 1.2rem;
      padding-top: 1rem;
      border-top: 2px solid rgba(255, 255, 255, 0.1);
    }
    
    .receipt-footer {
      background: rgba(0, 0, 0, 0.2);
      padding: 1.5rem 2rem;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .receipt-footer p {
      font-size: 0.9rem;
      margin: 0 0 1.2rem;
    }
    .actions { display: flex; gap: 1rem; }
    .w-100 { width: 100%; box-sizing: border-box; }
    .btn-primary, .btn-outline {
      flex: 1;
      display: block;
      text-decoration: none;
      padding: 0.8rem;
      border-radius: 6px;
      font-weight: 600;
      text-align: center;
      font-size: 1rem;
      transition: all 0.2s ease;
    }
    .btn-primary { 
      background: var(--color-primary, #22c55e); 
      color: #000; 
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
    }
    .btn-outline { 
      background: transparent; 
      color: var(--color-text-main, #fff); 
      border: 1px solid rgba(255, 255, 255, 0.3); 
    }
    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.05);
    }
  `]
})
export class CheckoutSuccessComponent implements OnInit {
  purchasedItems: any[] = [];
  subtotal = 0;
  date = new Date();
  sessionId = 'STRIPE-000';

  constructor(
    private cartService: CartService,
    private paymentService: PaymentService,
    private route: ActivatedRoute
  ) {}

  formatCurrency(value: number): string {
    return '$ ' + new Intl.NumberFormat('es-CO').format(value);
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.sessionId = params['session_id'] || 'TEST-999';
      
      if (this.sessionId && this.sessionId !== 'TEST-999') {
        this.paymentService.verifyCheckoutSession(this.sessionId).subscribe({
          next: () => {
             console.log('[CheckoutSuccess] Sesión de pago validada correctamente');
          },
          error: (err) => {
             console.error('[CheckoutSuccess] Error verificando sesión en el backend:', err);
          }
        });
      }
    });

    // Read saved cart from sessionStorage
    const saved = sessionStorage.getItem('last_checkout');
    if (saved) {
      try {
        const items = JSON.parse(saved);
        this.purchasedItems = items.map((i: any) => ({
          name: i.name,
          price: Number(i.price),
          qty: Number(i.quantity)
        }));
        this.subtotal = this.purchasedItems.reduce((acc, i) => acc + (i.price * i.qty), 0);
      } catch (e) {
        console.error('Error parsing last checkout from storage', e);
      }
    }

    // Force clear the current live cart so they don't buy it again
    this.cartService.clearCart();
  }
}

