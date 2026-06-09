import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private items: any[] = [];
  private cartSubject = new BehaviorSubject<any[]>(this.items);
  cart$ = this.cartSubject.asObservable();

  constructor() {
    this.loadCart();
  }

  private loadCart() {
    const saved = localStorage.getItem('realmyfit_cart');
    if (saved) {
      try {
        this.items = JSON.parse(saved);
        this.cartSubject.next(this.items);
      } catch (e) {
        console.error('Error loading cart', e);
      }
    }
  }

  private saveCart() {
    localStorage.setItem('realmyfit_cart', JSON.stringify(this.items));
  }

  addToCart(item: any, quantity: number = 1) {
    const existing = this.items.find((i) => i.name === item.name || i.id === item.id);
    if (existing) {
      existing.qty += quantity;
    } else {
      this.items.push({ ...item, qty: quantity, img: item.img || 'default' });
    }
    this.cartSubject.next(this.items);
    this.saveCart();
  }

  getItems() {
    return this.items;
  }

  removeFromCart(item: any) {
    this.items = this.items.filter((i) => i.name !== item.name && i.id !== item.id);
    this.cartSubject.next(this.items);
    this.saveCart();
  }

  clearCart() {
    this.items = [];
    this.cartSubject.next(this.items);
    this.saveCart();
  }
}
