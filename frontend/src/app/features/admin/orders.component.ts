import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersService } from '../../core/services/orders.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="view-header">
      <h2>Gestión de Órdenes</h2>
    </div>
    <div class="table-container glass">
      <div *ngIf="loading" class="loading-state">Cargando órdenes...</div>
      <table *ngIf="!loading && orders.length > 0">
        <thead>
          <tr><th>ID</th><th>Usuario</th><th>Total</th><th>Estado</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let o of orders">
            <td>#{{ o.id }}</td>
            <td>{{ o.user?.name || 'N/A' }}</td>
            <td>\${{ o.totalAmount }}</td>
            <td>{{ o.status }}</td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="!loading && orders.length === 0" class="empty-state">No hay órdenes registradas.</div>
    </div>
  `,
  styles: [`
    .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .table-container { padding: 1rem; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 1rem; color: rgba(255,255,255,0.6); font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.1); }
    td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .loading-state, .empty-state { padding: 3rem; text-align: center; color: rgba(255,255,255,0.5); }
  `]
})
export class AdminOrdersComponent implements OnInit {
  private service = inject(OrdersService);
  orders: any[] = [];
  loading = true;

  ngOnInit() {
    this.service.getOrders().subscribe({
      next: (data) => { this.orders = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
