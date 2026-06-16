import {
  Component, OnInit, OnDestroy,
  inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import { PaymentService } from '../../core/services/payment.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-checkout-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout-payment.html',
  styleUrls: ['./checkout-payment.scss'],
})
export class CheckoutPaymentComponent implements OnInit, OnDestroy {
    destroyRef = inject(DestroyRef);
  private paymentService = inject(PaymentService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  stripe: Stripe | null = null;
  cardElement: StripeCardElement | null = null;
  clientSecret = '';

  // Mode: cart or membership or event
  mode: 'cart' | 'membership' | 'event' = 'cart';
  membershipId: number | null = null;
  membershipName = '';
  membershipPrice = 0;

  eventId: number | null = null;
  eventName = '';
  eventPrice = 0;

  cartItems: any[] = [];
  isLoading = true;
  isProcessing = false;
  errorMessage = '';
  cardError = '';
  cardMounted = false;
  hasPaid = false;

  // Billing form
  cardholderName = '';

  get subtotal(): number {
    return this.cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  get total(): number {
    if (this.mode === 'membership') return this.membershipPrice;
    if (this.mode === 'event') return this.eventPrice;
    return this.subtotal;
  }

  formatCurrency(value: number): string {
    return '$ ' + new Intl.NumberFormat('es-CO').format(value);
  }

  getImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl}${url}`;
  }

  async ngOnInit() {
    const user = this.authService.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    // Detect mode from sessionStorage
    const pendingMembership = sessionStorage.getItem('pending_membership');
    const pendingEvent = sessionStorage.getItem('pending_event');
    if (pendingMembership) {
      const m = JSON.parse(pendingMembership);
      this.mode = 'membership';
      this.membershipId = m.id;
      this.membershipName = m.name;
      this.membershipPrice = m.price;
    } else if (pendingEvent) {
      const e = JSON.parse(pendingEvent);
      this.mode = 'event';
      this.eventId = e.id;
      this.eventName = e.title || e.name;
      this.eventPrice = e.price;
    } else {
      this.mode = 'cart';
      this.cartItems = this.cartService.getItems();
      if (this.cartItems.length === 0) {
        this.router.navigate(['/cart']);
        return;
      }
    }

    // Pre-fill cardholder from auth user
    this.cardholderName = user.name || '';

    // Load Stripe JS
    this.stripe = await loadStripe(environment.stripePublishableKey);

    // Request clientSecret from backend
    if (this.mode === 'membership') {
      this.paymentService.createMembershipPaymentIntent(this.membershipId!, user.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res) => { this.clientSecret = res.clientSecret; this.onSecretReady(); },
        error: (err) => { this.isLoading = false; this.errorMessage = err?.error?.message || 'Error al crear el pago.'; this.cdr.detectChanges(); }
      });
    } else if (this.mode === 'event') {
      this.paymentService.createEventPaymentIntent(this.eventId!, user.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res) => { this.clientSecret = res.clientSecret; this.onSecretReady(); },
        error: (err) => { this.isLoading = false; this.errorMessage = err?.error?.message || 'Error al crear el pago del evento.'; this.cdr.detectChanges(); }
      });
    } else {
      const items = this.cartItems.map(i => ({
        productId: i.id || i.productId,
        name: i.name,
        price: Number(i.price),
        quantity: i.qty,
        image: i.imageUrl || i.image || undefined,
      }));
      this.paymentService.createPaymentIntent(items, user.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res) => { this.clientSecret = res.clientSecret; this.onSecretReady(); },
        error: (err) => { this.isLoading = false; this.errorMessage = err?.error?.message || 'Error al crear el pago.'; this.cdr.detectChanges(); }
      });
    }
  }

  private onSecretReady() {
    this.isLoading = false;
    this.cdr.detectChanges(); // Render the form before mounting
    // Give Angular one tick to render #card-container in the DOM
    requestAnimationFrame(() => this.mountCard());
  }

  mountCard() {
    if (!this.stripe) return;
    const container = document.getElementById('card-container');
    if (!container) {
      // Retry once more
      setTimeout(() => this.mountCard(), 200);
      return;
    }

    const elements = this.stripe.elements({
      fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap' }]
    });

    this.cardElement = elements.create('card', {
      hidePostalCode: true,
      style: {
        base: {
          color: '#f5f5f5',
          fontFamily: 'Inter, sans-serif',
          fontSize: '16px',
          fontSmoothing: 'antialiased',
          fontWeight: '400',
          lineHeight: '24px',
          '::placeholder': { color: '#6b7280' },
          iconColor: '#27ae60',
        },
        invalid: {
          color: '#f87171',
          iconColor: '#f87171',
        },
        complete: {
          iconColor: '#27ae60',
          color: '#f5f5f5',
        }
      }
    });

    this.cardElement.mount('#card-container');
    this.cardMounted = true;

    this.cardElement.on('change', (event) => {
      this.cardError = event.error ? event.error.message : '';
      this.cdr.detectChanges();
    });
  }

  async pay() {
    if (!this.stripe || !this.cardElement || this.isProcessing) return;
    const user = this.authService.getUser();
    if (!user) return;

    this.isProcessing = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const { error, paymentIntent } = await this.stripe.confirmCardPayment(this.clientSecret, {
      payment_method: {
        card: this.cardElement,
        billing_details: {
          name: this.cardholderName || user.name || user.email,
          email: user.email,
        }
      }
    });

    if (error) {
      this.isProcessing = false;
      this.errorMessage = error.message || 'El pago falló. Revisa los datos de tu tarjeta.';
      this.cdr.detectChanges();
      
      // Notify backend locally about the failure so it can mark it as FAILED instead of PENDING 
      // (This overrides silent intent failures where Webhooks might be blocked locally)
      this.paymentService.failPaymentIntent(this.clientSecret).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        error: (err) => console.error('Error marking intent as failed locally:', err)
      });
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      this.hasPaid = true;
      this.paymentService.verifyPaymentIntent(this.clientSecret).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (verification) => {
          if (this.mode === 'cart') {
            const receipt = this.cartItems.map(i => ({
              name: i.name, price: Number(i.price), quantity: i.qty
            }));
            sessionStorage.setItem('last_checkout', JSON.stringify(receipt));
            this.cartService.clearCart();
          } else if (this.mode === 'membership') {
            sessionStorage.setItem('last_checkout', JSON.stringify([{
              name: `Membresía ${this.membershipName}`,
              price: this.membershipPrice,
              quantity: 1
            }]));
            sessionStorage.removeItem('pending_membership');
          } else if (this.mode === 'event') {
            sessionStorage.setItem('last_checkout', JSON.stringify([{
              name: `Entrada a Evento ${this.eventName}`,
              price: this.eventPrice,
              quantity: 1
            }]));
            sessionStorage.removeItem('pending_event');
          }

          this.router.navigate(['/checkout/success']);
        },
        error: (err) => {
          this.isProcessing = false;
          this.errorMessage = 'El pago se completó pero hubo un retraso confirmándolo. Revisa tu perfil.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  cancel() {
    sessionStorage.removeItem('pending_membership');
    sessionStorage.removeItem('pending_event');
    if (this.mode === 'membership') this.router.navigate(['/membresias']);
    else if (this.mode === 'event') this.router.navigate(['/eventos']);
    else this.router.navigate(['/cart']);
  }

  ngOnDestroy() {
    this.cardElement?.destroy();
    
    // Si la inicialización del pago está a medias y el usuario sale, lo cancelamos.
    if (this.clientSecret && !this.hasPaid && !this.isProcessing) {
      this.paymentService.cancelPaymentIntent(this.clientSecret).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        error: (err) => console.error('No se pudo cancelar el intento de pago o ya no existe.', err)
      });
    }
  }
}
