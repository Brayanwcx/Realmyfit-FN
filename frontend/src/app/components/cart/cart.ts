import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cart',
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent {
  cartItems = [
    { name: '100% Whey Protein', price: 59.99, qty: 1, img: 'suplements' },
    { name: 'Camiseta RealMyFit', price: 19.99, qty: 2, img: 'clothes' }
  ];

  get subtotal() {
    return this.cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  }

  get total() {
    return this.subtotal + 5.00; // Flat tax/shipping mock
  }
}
