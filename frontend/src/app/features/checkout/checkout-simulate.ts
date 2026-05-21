import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-checkout-simulate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="simulate-container">
      <div class="simulate-card">
        <h2>Simulación de Pago Seguro</h2>
        <p class="subtitle">Modo de prueba local (no se harán cargos reales)</p>

        <div class="card-element">
          <label>Número de Tarjeta (Prueba)</label>
          <input type="text" placeholder="4242 4242 4242 4242" [(ngModel)]="cardNumber" />
        </div>

        <div class="row">
          <div class="card-element half">
            <label>Expiración</label>
            <input type="text" placeholder="12/34" [(ngModel)]="expiry" />
          </div>
          <div class="card-element half">
            <label>CVC</label>
            <input type="text" placeholder="123" [(ngModel)]="cvc" />
          </div>
        </div>

        <div class="card-element">
          <label>Nombre en la tarjeta</label>
          <input type="text" placeholder="John Doe" [(ngModel)]="name" />
        </div>

        @if (error) {
          <div class="error-msg">{{ error }}</div>
        }

        <button
          class="btn-primary w-100 pay-btn"
          [disabled]="isProcessing"
          (click)="processPayment()"
        >
          {{ isProcessing ? 'Procesando...' : 'Pagar Ahora (' + (total | currency) + ')' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .simulate-container {
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--background);
      padding: 2rem;
    }
    .simulate-card {
      background-color: var(--surface);
      padding: 2.5rem;
      border-radius: 12px;
      width: 100%;
      max-width: 450px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.4);
      border: 1px solid var(--border-color);
    }
    h2 {
      margin-top: 0;
      color: var(--text-primary);
      text-align: center;
      font-size: 1.5rem;
    }
    .subtitle {
      color: var(--text-secondary);
      text-align: center;
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }
    .card-element {
      margin-bottom: 1.2rem;
    }
    .card-element label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.85rem;
    }
    .card-element input {
      width: 100%;
      padding: 0.75rem;
      border-radius: 6px;
      border: 1px solid var(--border-color);
      background-color: rgba(255, 255, 255, 0.05);
      color: var(--text-primary);
      font-size: 1rem;
    }
    .card-element input:focus {
      outline: none;
      border-color: var(--primary-color);
    }
    .row {
      display: flex;
      gap: 1rem;
    }
    .half {
      flex: 1;
    }
    .error-msg {
      color: #ff4d4f;
      background: rgba(255, 77, 79, 0.1);
      padding: 0.75rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      text-align: center;
    }
    .pay-btn {
      padding: 1rem;
      font-size: 1.1rem;
      font-weight: 600;
      margin-top: 1rem;
      border: none;
      border-radius: 8px;
    }
    .pay-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  `]
})
export class CheckoutSimulateComponent implements OnInit {
  cartItems: any[] = [];
  isProcessing = false;
  error: string | null = null;
  total = 0;

  cardNumber = '';
  expiry = '';
  cvc = '';
  name = '';

  constructor(
    private cartService: CartService,
    private paymentService: PaymentService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.total = items.reduce((acc, item) => acc + (Number(item.price) * item.qty), 0);
      if (this.total > 0) this.total += 5; // Shipping fee
    });

    if (this.cartItems.length === 0) {
      this.router.navigate(['/cart']);
    }
  }

  processPayment() {
    if (!this.cardNumber || !this.expiry || !this.cvc || !this.name) {
      this.error = 'Por favor completa todos los campos de prueba.';
      return;
    }

    const currentUser = this.authService.getUser();
    if (!currentUser) return;

    this.isProcessing = true;
    this.error = null;

    const items = this.cartItems.map(item => ({
      productId: item.id || item.productId,
      name: item.name,
      price: Number(item.price),
      quantity: item.qty,
      image: item.imageUrl || item.image || undefined,
    }));

    this.paymentService.simulatePayment(items, currentUser.id).subscribe({
      next: (res) => {
        if (res.success) {
          // Nav to success screen
          this.router.navigate(['/checkout/success']);
        }
      },
      error: (err) => {
        this.isProcessing = false;
        this.error = 'Ocurrió un error en la simulación del servidor. Intenta de nuevo.';
      }
    });
  }
}
