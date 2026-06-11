import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private authService = inject(AuthService);
  private items: any[] = [];
  private cartSubject = new BehaviorSubject<any[]>(this.items);
  cart$ = this.cartSubject.asObservable();

  constructor() {
    this.authService.currentUser.subscribe(() => {
      this.loadCart();
    });
  }

  private getStorageKey(): string {
    const user = this.authService.getUser();
    return user ? `realmyfit_cart_${user.id}` : 'realmyfit_cart_guest';
  }

  private loadCart() {
    const saved = localStorage.getItem(this.getStorageKey());
    if (saved) {
      try {
        this.items = JSON.parse(saved);
        this.cartSubject.next(this.items);
      } catch (e) {
        console.error('Error loading cart', e);
        this.items = [];
        this.cartSubject.next(this.items);
      }
    } else {
      this.items = [];
      this.cartSubject.next(this.items);
    }
  }

  private saveCart() {
    localStorage.setItem(this.getStorageKey(), JSON.stringify(this.items));
  }

  addToCart(item: any, quantity: number = 1): { success: boolean; message?: string } {
    const existing = this.items.find(i => i.id === item.id);
    const availableStock = item.stock || 0;

    if (existing) {
      if (existing.qty + quantity > availableStock) {
        existing.qty = availableStock;
        this.cartSubject.next(this.items);
        return { success: false, message: 'Stock máximo alcanzado' };
      }
      existing.qty += quantity;
    } else {
      if (quantity > availableStock) {
        this.items.push({ ...item, qty: availableStock });
        this.cartSubject.next(this.items);
        return { success: false, message: 'Stock máximo alcanzado' };
      }
      this.items.push({ ...item, qty: quantity });
    }
    
    this.cartSubject.next(this.items);
    this.saveCart();
    return { success: true };
  }

  getItems() {
    return this.items;
  }

  removeFromCart(item: any) {
    this.items = this.items.filter(i => i.id !== item.id);
    this.cartSubject.next(this.items);
    this.saveCart();
  }

  clearCart() {
    this.items = [];
    this.cartSubject.next(this.items);
    this.saveCart();
  }
}
