import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  isCheckingOut = false;
  checkoutError: string | null = null;

  constructor(
    private cartService: CartService,
    private paymentService: PaymentService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
    });
  }

  get subtotal() {
    return this.cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  }

  get total() {
    return this.subtotal;
  }

  getImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl}${url}`;
  }

  removeItem(item: any) {
    this.cartService.removeFromCart(item);
  }

  checkout() {
    if (this.cartItems.length === 0) return;

    const currentUser = this.authService.getUser();
    if (!currentUser) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/cart' } });
      return;
    }

    this.isCheckingOut = true;
    this.checkoutError = null;

    const items = this.cartItems.map(item => ({
      productId: item.id || item.productId,
      name: item.name,
      price: Number(item.price),
      quantity: item.qty,
      image: item.imageUrl || item.image || undefined,
    }));

    this.paymentService.createCheckoutSession(items, currentUser.id).subscribe({
      next: (res) => {
        // Save items briefly to sessionStorage so the success page can show the receipt
        sessionStorage.setItem('last_checkout', JSON.stringify(items));
        // Redirect to Stripe Checkout
        window.location.href = res.url;
      },
      error: (err) => {
        this.isCheckingOut = false;
        this.checkoutError = err?.error?.message || 'Error al iniciar el pago. Intenta nuevamente.';
      }
    });
  }
}
