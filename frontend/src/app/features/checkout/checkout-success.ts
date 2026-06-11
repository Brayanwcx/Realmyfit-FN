import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-checkout-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './checkout-success.html',
  styleUrls: ['./checkout-success.scss']})
export class CheckoutSuccessComponent implements OnInit {
  purchasedItems: any[] = [];
  subtotal = 0;
  date = new Date();

  formatCurrency(value: number): string {
    return '$ ' + new Intl.NumberFormat('es-CO').format(value);
  }

  ngOnInit() {
    // Read purchased items from sessionStorage (saved right after successful payment)
    const saved = sessionStorage.getItem('last_checkout');
    if (saved) {
      try {
        const items = JSON.parse(saved);
        this.purchasedItems = items.map((i: any) => ({
          name: i.name,
          price: Number(i.price),
          qty: Number(i.quantity || i.qty || 1)
        }));
        this.subtotal = this.purchasedItems.reduce((acc, i) => acc + (i.price * i.qty), 0);
        sessionStorage.removeItem('last_checkout');
      } catch (e) {
        console.error('Error parsing last checkout from storage', e);
      }
    }
  }
}

