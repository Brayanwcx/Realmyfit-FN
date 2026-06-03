import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { OrdersService } from '../../core/services/orders.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Header -->
    <div class="view-header">
      <h2>Gestión de Pedidos</h2>
      <div class="header-stats">
        <span class="stat-chip pending">Pendientes: {{ countByStatus('PENDING') }}</span>
        <span class="stat-chip confirmed">Confirmados: {{ countByStatus('CONFIRMED') }}</span>
        <span class="stat-chip delivered">Entregados: {{ countByStatus('DELIVERED') }}</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-row">
      <div class="search-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="page = 1" placeholder="Buscar por cliente o ID..." />
      </div>
      <select [(ngModel)]="statusFilter" (ngModelChange)="page = 1" class="filter-select">
        <option value="">Todos los estados</option>
        <option value="PENDING">Pendiente</option>
        <option value="CONFIRMED">Confirmado</option>
        <option value="DELIVERED">Entregado</option>
        <option value="CANCELLED">Cancelado</option>
      </select>
    </div>

    <div class="table-container glass">
      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando pedidos...</p>
        </div>
      }

      @if (!loading && filteredOrders.length > 0) {
        <!-- Desktop Table -->
        <table class="desktop-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Productos</th>
              <th>Total</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (order of pagedOrders; track order.id) {
              <tr>
                <td><span class="order-id">#{{ order.id }}</span></td>
                <td>
                  <div class="product-name">{{ order.user?.name }} {{ order.user?.lastName }}</div>
                  <div class="product-desc">{{ order.user?.email }}</div>
                </td>
                <td>
                  <div class="items-summary">
                    @for (item of (order.items || []).slice(0, 2); track item.id) {
                      <span class="item-chip">{{ item.quantity }}x {{ item.product?.name }}</span>
                    }
                    @if ((order.items?.length || 0) > 2) {
                      <span class="product-desc">+{{ (order.items?.length || 0) - 2 }} más</span>
                    }
                  </div>
                </td>
                <td><span class="font-bold">{{ formatCurrency(order.totalAmount) }}</span></td>
                <td class="font-bold">{{ order.createdAt | date:'dd/MM/yyyy' }}</td>
                <td>
                  <select
                    [(ngModel)]="order.status"
                    (ngModelChange)="onStatusChange(order, $event)"
                    class="status-select"
                    [ngClass]="getStatusClass(order.status)">
                    <option value="PENDING">Pendiente</option>
                    <option value="CONFIRMED">Confirmado</option>
                    <option value="DELIVERED">Entregado</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="btn-icon" (click)="viewDetails(order)" title="Ver detalles">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      Ver
                    </button>
                    <button class="btn-icon delete" (click)="deleteOrder(order)" title="Eliminar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>

        <!-- Mobile Cards -->
        <div class="mobile-cards">
          @for (order of pagedOrders; track order.id) {
            <div class="mobile-card glass">
              <div class="card-header">
                <div class="card-title" style="margin-left:0">
                  <span class="order-id">#{{ order.id }}</span>
                  <h4>{{ order.user?.name }} {{ order.user?.lastName }}</h4>
                </div>
              </div>
              <div class="card-row">
                <span class="card-label">Total</span>
                <span class="card-value font-bold">{{ formatCurrency(order.totalAmount) }}</span>
              </div>
              <div class="card-row">
                <span class="card-label">Fecha</span>
                <span class="card-value">{{ order.createdAt | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="card-row">
                <span class="card-label">Estado</span>
                <select [(ngModel)]="order.status" (ngModelChange)="onStatusChange(order, $event)" class="status-select" [ngClass]="getStatusClass(order.status)">
                  <option value="PENDING">Pendiente</option>
                  <option value="CONFIRMED">Confirmado</option>
                  <option value="DELIVERED">Entregado</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>
              <div class="card-actions">
                <button class="btn-icon" (click)="viewDetails(order)">Ver detalles</button>
                <button class="btn-icon delete" (click)="deleteOrder(order)">Eliminar</button>
              </div>
            </div>
          }
        </div>

        <!-- Paginación -->
        @if (totalPages > 1) {
          <div class="pagination">
            <button class="page-btn" (click)="page = 1" [disabled]="page === 1">«</button>
            <button class="page-btn" (click)="page = page - 1" [disabled]="page === 1">‹</button>
            @for (p of pageNumbers; track p) {
              <button class="page-btn" [class.active]="p === page" (click)="page = p">{{ p }}</button>
            }
            <button class="page-btn" (click)="page = page + 1" [disabled]="page === totalPages">›</button>
            <button class="page-btn" (click)="page = totalPages" [disabled]="page === totalPages">»</button>
            <span class="page-info">{{ (page-1)*pageSize+1 }}–{{ min(page*pageSize, filteredOrders.length) }} de {{ filteredOrders.length }}</span>
          </div>
        }
      }

      @if (!loading && filteredOrders.length === 0) {
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          <p>No se encontraron pedidos.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .view-header h2 { font-size: 1.8rem; margin: 0; font-weight: 700; background: linear-gradient(to right, #fff, rgba(255,255,255,0.7)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    
    .header-stats { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .stat-chip { padding: 0.35rem 0.9rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
    .stat-chip.pending { background: rgba(251,191,36,0.1); color: #fbbf24; border: 1px solid rgba(251,191,36,0.2); }
    .stat-chip.confirmed { background: rgba(99,102,241,0.1); color: #818cf8; border: 1px solid rgba(99,102,241,0.2); }
    .stat-chip.delivered { background: rgba(34,197,94,0.1); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }

    /* Filters */
    .filters-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      min-width: 200px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 0.6rem 1rem;
      color: rgba(255,255,255,0.5);
    }
    .search-box input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #fff;
      font-size: 0.9rem;
    }
    .search-box input::placeholder { color: rgba(255,255,255,0.3); }
    .filter-select {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: #fff;
      padding: 0.6rem 1rem;
      border-radius: 10px;
      font-size: 0.9rem;
      cursor: pointer;
      outline: none;
    }
    .filter-select option { background: #1a1a2e; color: #fff; }

    .table-container { padding: 1.5rem; overflow-x: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
    .desktop-table { width: 100%; min-width: 800px; border-collapse: separate; border-spacing: 0; text-align: left; }
    .desktop-table th { padding: 1rem; color: rgba(255,255,255,0.6); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .desktop-table td { padding: 1.2rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; }

    .loading-state, .empty-state { padding: 4rem 2rem; text-align: center; color: rgba(255,255,255,0.5); display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .empty-state svg { color: rgba(255,255,255,0.2); }

    .order-id { font-family: monospace; color: #a78bfa; font-weight: 700; font-size: 0.95rem; }
    .product-name { font-weight: 600; font-size: 1rem; color: #fff; margin-bottom: 0.2rem; }
    .product-desc { font-size: 0.82rem; color: rgba(255,255,255,0.45); }
    .font-bold { font-weight: 700; color: #4ade80; }

    .items-summary { display: flex; flex-wrap: wrap; gap: 0.3rem; max-width: 220px; }
    .item-chip { background: rgba(99,102,241,0.1); color: rgba(255,255,255,0.75); padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.78rem; white-space: nowrap; }

    .status-select {
      border: none;
      border-radius: 20px;
      padding: 0.3rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      outline: none;
      -webkit-appearance: none;
    }
    .status-select option { background: #1a1a2e; color: #fff; }
    .status-select.pending { background: rgba(251,191,36,0.15); color: #fbbf24; }
    .status-select.confirmed { background: rgba(99,102,241,0.15); color: #818cf8; }
    .status-select.delivered { background: rgba(34,197,94,0.15); color: #4ade80; }
    .status-select.cancelled { background: rgba(239,68,68,0.15); color: #f87171; }

    .actions-cell { display: flex; gap: 0.5rem; }
    .btn-icon { display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.5rem 0.8rem; border-radius: 8px; cursor: pointer; transition: 0.3s; font-size: 0.8rem; font-weight: 500; }
    .btn-icon:hover { background: rgba(255,255,255,0.1); }
    .btn-icon.delete:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #f87171; }

    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--color-primary, #22c55e); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .pagination { display: flex; align-items: center; gap: 0.4rem; justify-content: center; padding: 1.5rem 0 0.5rem; flex-wrap: wrap; }
    .page-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: 0.2s; display: inline-flex; align-items: center; justify-content: center; }
    .page-btn:hover:not(:disabled) { background: rgba(255,255,255,0.12); }
    .page-btn.active { background: var(--color-primary, #22c55e); color: #000; font-weight: 700; border-color: transparent; }
    .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .page-info { font-size: 0.8rem; color: rgba(255,255,255,0.45); margin-left: 0.5rem; }

    .mobile-cards { display: none; }
    @media (max-width: 768px) {
      .desktop-table { display: none; }
      .mobile-cards { display: flex; flex-direction: column; gap: 1rem; }
      .mobile-card { padding: 1.25rem; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
      .card-header { margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .card-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; }
      .card-label { font-size: 0.85rem; color: rgba(255,255,255,0.6); }
      .card-value { color: white; font-weight: 500; }
      .card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); }
      .card-actions .btn-icon { justify-content: center; }
    }
  `]
})
export class AdminOrdersComponent implements OnInit {
  private ordersService = inject(OrdersService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  orders: any[] = [];
  loading = true;
  searchTerm = '';
  statusFilter = '';
  page = 1;
  pageSize = 10;

  get totalPages() { return Math.ceil(this.filteredOrders.length / this.pageSize); }
  get pagedOrders() { return this.filteredOrders.slice((this.page-1)*this.pageSize, this.page*this.pageSize); }
  get pageNumbers() { return Array.from({length: this.totalPages}, (_, i) => i + 1); }
  min(a: number, b: number) { return Math.min(a, b); }

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.cdr.detectChanges();

    this.ordersService.getOrders()
      .pipe(
        catchError((err) => {
          console.error('[AdminOrders] Error al cargar pedidos:', err);
          Swal.fire('Error', `No se pudieron cargar los pedidos. (${err?.status ?? 'sin conexión'})`, 'error');
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe((data) => {
        this.ngZone.run(() => {
          this.orders = data.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          this.page = 1;
          this.cdr.detectChanges();
        });
      });
  }

  get filteredOrders() {
    return this.orders.filter(o => {
      let term = (this.searchTerm || '').toLowerCase().trim();
      if (term.startsWith('#')) term = term.substring(1);
      
      const searchString = `${o.user?.name || ''} ${o.user?.lastName || ''} ${o.user?.email || ''} ${o.id || ''}`.toLowerCase();
      const matchSearch = !term || searchString.includes(term);
      const matchStatus = !this.statusFilter || o.status === this.statusFilter;
      return matchSearch && matchStatus;
    });
  }

  countByStatus(status: string) {
    return this.orders.filter(o => o.status === status).length;
  }

  formatCurrency(value: number): string {
    return '$ ' + new Intl.NumberFormat('es-CO').format(Number(value));
  }

  getStatusClass(status: string): string {
    const map: any = {
      PENDING: 'pending', CONFIRMED: 'confirmed',
      DELIVERED: 'delivered', CANCELLED: 'cancelled'
    };
    return map[status] || 'pending';
  }

  onStatusChange(order: any, newStatus: string) {
    const oldStatus = order.status;
    const statusMap: any = { PENDING: 'Pendiente', CONFIRMED: 'Confirmado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado' };
    const statusEs = statusMap[newStatus] || newStatus;

    this.ordersService.updateOrder(order.id, { status: newStatus }).subscribe({
      next: (updated) => {
        this.ngZone.run(() => {
          order.status = updated.status;
          this.cdr.detectChanges();
        });
        Swal.fire('¡Estado actualizado!', `El pedido #${order.id} ahora está en estado '${statusEs}'`, 'success');
      },
      error: () => {
        this.ngZone.run(() => {
          order.status = oldStatus;
          this.cdr.detectChanges();
        });
        Swal.fire('Error', 'No se pudo actualizar el estado.', 'error');
      }
    });
  }

  viewDetails(order: any) {
    const items = (order.items || []).map((i: any) =>
      `<tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
        <td style="padding:0.5rem;color:#fff">${i.quantity}x ${i.product?.name || 'Producto'}</td>
        <td style="padding:0.5rem;text-align:right;color:rgba(255,255,255,0.6)">$ ${new Intl.NumberFormat('es-CO').format(Number(i.unitPrice))}</td>
        <td style="padding:0.5rem;text-align:right;font-weight:700;color:#4ade80">$ ${new Intl.NumberFormat('es-CO').format(Number(i.subtotal))}</td>
      </tr>`
    ).join('');

    Swal.fire({
      title: `Pedido #${order.id}`,
      html: `
        <div style="text-align:left;font-size:0.9rem">
          <p style="color:rgba(255,255,255,0.6);margin:0 0 1rem">
            <strong style="color:#fff">${order.user?.name} ${order.user?.lastName}</strong><br>
            ${order.user?.email}<br>
            Fecha: ${new Date(order.createdAt).toLocaleDateString('es-CO')}
          </p>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="border-bottom:1px solid rgba(255,255,255,0.15)">
              <th style="padding:0.5rem;color:rgba(255,255,255,0.5);font-weight:500;text-align:left">Producto</th>
              <th style="padding:0.5rem;color:rgba(255,255,255,0.5);font-weight:500;text-align:right">P. Unit.</th>
              <th style="padding:0.5rem;color:rgba(255,255,255,0.5);font-weight:500;text-align:right">Subtotal</th>
            </tr></thead>
            <tbody>${items}</tbody>
          </table>
          <div style="margin-top:1rem;padding-top:1rem;border-top:2px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;font-size:1.1rem">
            <strong style="color:#fff">Total Pagado</strong>
            <strong style="color:#4ade80">$ ${new Intl.NumberFormat('es-CO').format(Number(order.totalAmount))}</strong>
          </div>
          ${order.notes ? `<p style="margin-top:0.75rem;color:rgba(255,255,255,0.4);font-size:0.85rem">Notas: ${order.notes}</p>` : ''}
        </div>
      `,
      background: '#1a1a2e',
      color: '#f5f5f5',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#7c3aed',
      width: '550px'
    });
  }

  deleteOrder(order: any) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto. Se eliminará el pedido permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.ordersService.deleteOrder(order.id).subscribe({
          next: () => {
            this.ngZone.run(() => {
              this.orders = this.orders.filter(o => o.id !== order.id);
              this.cdr.detectChanges();
            });
            Swal.fire('¡Eliminado!', 'El pedido ha sido eliminado.', 'success');
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar el pedido.', 'error')
        });
      }
    });
  }
}
