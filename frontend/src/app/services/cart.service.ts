import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private items: any[] = [];
  private cartSubject = new BehaviorSubject<any[]>(this.items);
  cart$ = this.cartSubject.asObservable();

  addToCart(item: any) {
    const existing = this.items.find(i => i.name === item.name);
    if (existing) {
      existing.qty += 1;
    } else {
      this.items.push({ ...item, qty: 1, img: 'default' });
    }
    this.cartSubject.next(this.items);
  }

  getItems() {
    return this.items;
  }

  removeFromCart(item: any) {
    this.items = this.items.filter(i => i.name !== item.name);
    this.cartSubject.next(this.items);
  }
}
