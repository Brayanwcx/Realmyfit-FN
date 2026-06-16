import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit {
    destroyRef = inject(DestroyRef);
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
    this.cartService.cart$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(items => {
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

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO').format(price);
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

    // Store items briefly so the checkout page can read them
    sessionStorage.setItem('last_checkout', JSON.stringify(this.cartItems.map(i => ({
      name: i.name, price: i.price, quantity: i.qty
    }))));

    // Clear any stale membership or event checkout states
    sessionStorage.removeItem('pending_membership');
    sessionStorage.removeItem('pending_event');

    // Navigate to our custom payment form
    this.router.navigate(['/checkout/pay']);
  }
}
