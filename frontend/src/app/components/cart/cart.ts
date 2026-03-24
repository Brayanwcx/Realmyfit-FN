import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];

  constructor(private cartService: CartService) {}

  ngOnInit() {
    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
    });
  }

  get subtotal() {
    return this.cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  }

  get total() {
    return this.subtotal > 0 ? this.subtotal + 5.00 : 0; // Flat tax/shipping mock
  }

  removeItem(item: any) {
    this.cartService.removeFromCart(item);
  }
}
