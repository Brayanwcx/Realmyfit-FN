import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaymentService } from '../../core/services/payment.service';
import { OrdersService } from '../../core/services/orders.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="view-header">
      <h2>Gestión de Pagos</h2>
      <div class="header-stats">
        <span class="stat-chip pending">Pendientes: {{ countByStatus('PENDING') }}</span>
        <span class="stat-chip completed">Completados: {{ countByStatus('COMPLETED') }}</span>
        <span class="stat-chip failed">Fallidos: {{ countByStatus('FAILED') }}</span>
      </div>
    </div>

    <div class="filters-row">
      <div class="search-box">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          [(ngModel)]="searchTerm"
          (ngModelChange)="page = 1"
          placeholder="Buscar por usuario, correo, ID o referencia..."
        />
      </div>
      <select [(ngModel)]="statusFilter" (ngModelChange)="page = 1" class="filter-select">
        <option value="">Todos los estados</option>
        <option value="PENDING">Pendiente</option>
        <option value="COMPLETED">Completado</option>
        <option value="FAILED">Fallido</option>
        <option value="REFUNDED">Reembolsado</option>
      </select>
    </div>

    <div class="table-container glass">
      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando pagos...</p>
        </div>
      }

      @if (!loading && filteredPayments.length > 0) {
        <table class="desktop-table">
          <thead>
            <tr>
              <th>ID Pago</th>
              <th>Usuario</th>
              <th>Artículos comprados</th>
              <th>Monto</th>
              <th>Método</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (payment of pagedPayments; track payment.id) {
              <tr>
                <td>
                  <div class="payment-id">#{{ payment.id }}</div>
                  <div class="product-desc">
                    {{ payment.reference || payment.stripeSessionId || 'Sin referencia' }}
                  </div>
                </td>
                <td>
                  <div class="product-name">
                    {{ payment.user?.name || 'Usuario' }} {{ payment.user?.lastName || '' }}
                  </div>
                  <div class="product-desc">{{ payment.user?.email || 'Sin correo' }}</div>
                </td>
                <td>
                  <div class="items-summary">
                    @if (payment.items.length > 0) {
                      @for (item of payment.items.slice(0, 2); track $index) {
                        <span class="item-chip">{{ item.quantity }}x {{ item.name }}</span>
                      }
                      @if (payment.items.length > 2) {
                        <span class="product-desc">+{{ payment.items.length - 2 }} más</span>
                      }
                    } @else {
                      <span class="product-desc">No hay artículos asociados</span>
                    }
                  </div>
                </td>
                <td>
                  <span class="font-bold">{{ formatCurrency(payment.amount) }}</span>
                </td>
                <td>
                  <span class="method-chip">{{ formatMethod(payment.paymentMethod) }}</span>
                </td>
                <td>
                  <span class="status-badge" [ngClass]="getStatusClass(payment.status)">
                    {{ formatStatus(payment.status) }}
                  </span>
                </td>
                <td class="font-date">{{ payment.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>
                  <div class="actions-cell">
                    <button class="btn-icon" (click)="viewDetails(payment)" title="Ver detalles">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      Ver
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>

        <div class="mobile-cards">
          @for (payment of pagedPayments; track payment.id) {
            <div class="mobile-card glass">
              <div class="card-header">
                <div class="card-title" style="margin-left:0">
                  <span class="payment-id">#{{ payment.id }}</span>
                  <h4>{{ payment.user?.name || 'Usuario' }} {{ payment.user?.lastName || '' }}</h4>
                </div>
              </div>
              <div class="card-row">
                <span class="card-label">Monto</span>
                <span class="card-value font-bold">{{ formatCurrency(payment.amount) }}</span>
              </div>
              <div class="card-row">
                <span class="card-label">Método</span>
                <span class="card-value">{{ formatMethod(payment.paymentMethod) }}</span>
              </div>
              <div class="card-row">
                <span class="card-label">Estado</span>
                <span class="status-badge" [ngClass]="getStatusClass(payment.status)">
                  {{ formatStatus(payment.status) }}
                </span>
              </div>
              <div class="card-row">
                <span class="card-label">Artículos</span>
                <span class="card-value">{{ payment.items.length }}</span>
              </div>
              <div class="card-actions">
                <button class="btn-icon" (click)="viewDetails(payment)">Ver detalles</button>
              </div>
            </div>
          }
        </div>

        @if (totalPages > 1) {
          <div class="pagination">
            <button class="page-btn" (click)="page = 1" [disabled]="page === 1">«</button>
            <button class="page-btn" (click)="page = page - 1" [disabled]="page === 1">‹</button>
            @for (p of pageNumbers; track p) {
              <button class="page-btn" [class.active]="p === page" (click)="page = p">
                {{ p }}
              </button>
            }
            <button class="page-btn" (click)="page = page + 1" [disabled]="page === totalPages">
              ›
            </button>
            <button class="page-btn" (click)="page = totalPages" [disabled]="page === totalPages">
              »
            </button>
            <span class="page-info"
              >{{ (page - 1) * pageSize + 1 }}–{{
                min(page * pageSize, filteredPayments.length)
              }}
              de {{ filteredPayments.length }}</span
            >
          </div>
        }
      }

      @if (!loading && filteredPayments.length === 0) {
        <div class="empty-state">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
          <p>No se encontraron pagos.</p>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .view-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .view-header h2 {
        font-size: 1.8rem;
        margin: 0;
        font-weight: 700;
        background: linear-gradient(to right, #fff, rgba(255, 255, 255, 0.7));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .header-stats {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .stat-chip {
        padding: 0.35rem 0.9rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
      }
      .stat-chip.pending {
        background: rgba(251, 191, 36, 0.1);
        color: #fbbf24;
        border: 1px solid rgba(251, 191, 36, 0.2);
      }
      .stat-chip.completed {
        background: rgba(34, 197, 94, 0.1);
        color: #4ade80;
        border: 1px solid rgba(34, 197, 94, 0.2);
      }
      .stat-chip.failed {
        background: rgba(239, 68, 68, 0.1);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.2);
      }
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
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        padding: 0.6rem 1rem;
        color: rgba(255, 255, 255, 0.5);
      }
      .search-box input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: #fff;
        font-size: 0.9rem;
      }
      .search-box input::placeholder {
        color: rgba(255, 255, 255, 0.3);
      }
      .filter-select {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #fff;
        padding: 0.6rem 1rem;
        border-radius: 10px;
        font-size: 0.9rem;
        cursor: pointer;
        outline: none;
      }
      .filter-select option {
        background: #1a1a2e;
        color: #fff;
      }
      .table-container {
        padding: 1.5rem;
        overflow-x: auto;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .desktop-table {
        width: 100%;
        min-width: 980px;
        border-collapse: separate;
        border-spacing: 0;
        text-align: left;
      }
      .desktop-table th {
        padding: 1rem;
        color: rgba(255, 255, 255, 0.6);
        font-weight: 600;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      .desktop-table td {
        padding: 1.2rem 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        vertical-align: middle;
      }
      .loading-state,
      .empty-state {
        padding: 4rem 2rem;
        text-align: center;
        color: rgba(255, 255, 255, 0.5);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }
      .empty-state svg {
        color: rgba(255, 255, 255, 0.2);
      }
      .payment-id {
        font-family: monospace;
        color: #a78bfa;
        font-weight: 700;
        font-size: 0.95rem;
      }
      .product-name {
        font-weight: 600;
        font-size: 1rem;
        color: #fff;
        margin-bottom: 0.2rem;
      }
      .product-desc {
        font-size: 0.82rem;
        color: rgba(255, 255, 255, 0.45);
      }
      .font-bold {
        font-weight: 700;
        color: #4ade80;
      }
      .font-date {
        color: rgba(255, 255, 255, 0.75);
        font-weight: 500;
      }
      .items-summary {
        display: flex;
        flex-wrap: wrap;
        gap: 0.3rem;
        max-width: 260px;
      }
      .item-chip {
        background: rgba(99, 102, 241, 0.1);
        color: rgba(255, 255, 255, 0.75);
        padding: 0.2rem 0.5rem;
        border-radius: 6px;
        font-size: 0.78rem;
        white-space: nowrap;
      }
      .method-chip {
        display: inline-flex;
        align-items: center;
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        background: rgba(59, 130, 246, 0.15);
        color: #93c5fd;
        font-size: 0.78rem;
        font-weight: 600;
      }
      .status-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        padding: 0.35rem 0.8rem;
        font-size: 0.8rem;
        font-weight: 600;
      }
      .status-badge.pending {
        background: rgba(251, 191, 36, 0.15);
        color: #fbbf24;
      }
      .status-badge.completed {
        background: rgba(34, 197, 94, 0.15);
        color: #4ade80;
      }
      .status-badge.failed {
        background: rgba(239, 68, 68, 0.15);
        color: #f87171;
      }
      .status-badge.refunded {
        background: rgba(168, 85, 247, 0.15);
        color: #c084fc;
      }
      .actions-cell {
        display: flex;
        gap: 0.5rem;
      }
      .btn-icon {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #fff;
        padding: 0.5rem 0.8rem;
        border-radius: 8px;
        cursor: pointer;
        transition: 0.3s;
        font-size: 0.8rem;
        font-weight: 500;
      }
      .btn-icon:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-top-color: var(--color-primary, #22c55e);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .pagination {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        justify-content: center;
        padding: 1.5rem 0 0.5rem;
        flex-wrap: wrap;
      }
      .page-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #fff;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: 0.2s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .page-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.12);
      }
      .page-btn.active {
        background: var(--color-primary, #22c55e);
        color: #000;
        font-weight: 700;
        border-color: transparent;
      }
      .page-btn:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
      .page-info {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.45);
        margin-left: 0.5rem;
      }
      .mobile-cards {
        display: none;
      }
      @media (max-width: 768px) {
        .desktop-table {
          display: none;
        }
        .mobile-cards {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .mobile-card {
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .card-header {
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .card-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          gap: 1rem;
        }
        .card-label {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .card-value {
          color: white;
          font-weight: 500;
          text-align: right;
        }
        .card-actions {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
          margin-top: 1.25rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .card-actions .btn-icon {
          justify-content: center;
        }
      }
    `,
  ],
})
export class AdminOrdersComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private ordersService = inject(OrdersService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  payments: any[] = [];
  loading = true;
  searchTerm = '';
  statusFilter = '';
  page = 1;
  pageSize = 10;

  get totalPages() {
    return Math.ceil(this.filteredPayments.length / this.pageSize) || 1;
  }

  get pagedPayments() {
    return this.filteredPayments.slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
  }

  get pageNumbers() {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  min(a: number, b: number) {
    return Math.min(a, b);
  }

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.loading = true;
    this.cdr.detectChanges();

    forkJoin({
      payments: this.paymentService.getPayments(),
      orders: this.ordersService.getOrders().pipe(catchError(() => of([]))),
    })
      .pipe(
        catchError((err) => {
          console.error('[AdminPayments] Error al cargar pagos:', err);
          Swal.fire(
            'Error',
            `No se pudieron cargar los pagos. (${err?.status ?? 'sin conexión'})`,
            'error',
          );
          return of({ payments: [], orders: [] });
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe(({ payments, orders }) => {
        this.ngZone.run(() => {
          this.payments = this.mergePaymentsWithOrders(payments, orders).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          this.page = 1;
          this.cdr.detectChanges();
        });
      });
  }

  private mergePaymentsWithOrders(payments: any[], orders: any[]) {
    const ordersByUser = new Map<number, any[]>();

    for (const order of orders) {
      const userId = order?.user?.id ?? order?.user_id;
      if (!userId) continue;
      const current = ordersByUser.get(userId) ?? [];
      current.push(order);
      ordersByUser.set(userId, current);
    }

    return payments.map((payment) => {
      const userId = payment?.user?.id ?? payment?.user_id;
      const relatedOrders = userId ? (ordersByUser.get(userId) ?? []) : [];
      const matchedOrder = this.findBestMatchingOrder(payment, relatedOrders);
      const items = (matchedOrder?.items ?? []).map((item: any) => ({
        id: item.id,
        name: item.product?.name || 'Producto',
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice || 0),
        subtotal: Number(item.subtotal || 0),
      }));

      return {
        ...payment,
        amount: Number(payment.amount || 0),
        items,
        linkedOrderId: matchedOrder?.id ?? null,
        linkedOrderStatus: matchedOrder?.status ?? null,
        paymentReference: payment.reference || payment.stripeSessionId || `PAY-${payment.id}`,
      };
    });
  }

  private findBestMatchingOrder(payment: any, orders: any[]) {
    if (!orders.length) return null;

    const stripeMatch = orders.find(
      (order) => payment.stripeSessionId && order.notes === payment.stripeSessionId,
    );
    if (stripeMatch) return stripeMatch;

    const exactAmount = orders.find(
      (order) => Number(order.totalAmount || 0) === Number(payment.amount || 0),
    );
    if (exactAmount) return exactAmount;

    return orders[0];
  }

  get filteredPayments() {
    return this.payments.filter((payment) => {
      const term = (this.searchTerm || '').toLowerCase().trim();
      const itemNames = payment.items.map((item: any) => item.name).join(' ');
      const searchString =
        `${payment.user?.name || ''} ${payment.user?.lastName || ''} ${payment.user?.email || ''} ${payment.id || ''} ${payment.paymentReference || ''} ${itemNames}`.toLowerCase();
      const matchSearch = !term || searchString.includes(term);
      const matchStatus = !this.statusFilter || payment.status === this.statusFilter;
      return matchSearch && matchStatus;
    });
  }

  countByStatus(status: string) {
    return this.payments.filter((payment) => payment.status === status).length;
  }

  formatCurrency(value: number): string {
    return '$ ' + new Intl.NumberFormat('es-CO').format(Number(value));
  }

  formatMethod(method: string): string {
    const labels: Record<string, string> = {
      CASH: 'Efectivo',
      CARD: 'Tarjeta',
      TRANSFER: 'Transferencia',
      STRIPE: 'Stripe',
    };
    return labels[method] || method || 'No definido';
  }

  formatStatus(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      COMPLETED: 'Completado',
      FAILED: 'Fallido',
      REFUNDED: 'Reembolsado',
    };
    return labels[status] || status || 'Sin estado';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'pending',
      COMPLETED: 'completed',
      FAILED: 'failed',
      REFUNDED: 'refunded',
    };
    return map[status] || 'pending';
  }

  viewDetails(payment: any) {
    const itemsHtml = payment.items.length
      ? payment.items
          .map(
            (item: any) => `
              <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
                <td style="padding:0.5rem;color:#fff">${item.quantity}x ${item.name}</td>
                <td style="padding:0.5rem;text-align:right;color:rgba(255,255,255,0.6)">$ ${new Intl.NumberFormat('es-CO').format(Number(item.unitPrice))}</td>
                <td style="padding:0.5rem;text-align:right;font-weight:700;color:#4ade80">$ ${new Intl.NumberFormat('es-CO').format(Number(item.subtotal))}</td>
              </tr>
            `,
          )
          .join('')
      : `
        <tr>
          <td colspan="3" style="padding:0.75rem;color:rgba(255,255,255,0.5);text-align:center">
            No hay artículos asociados a este pago.
          </td>
        </tr>
      `;

    Swal.fire({
      title: `Pago #${payment.id}`,
      html: `
        <div style="text-align:left;font-size:0.9rem">
          <p style="color:rgba(255,255,255,0.6);margin:0 0 1rem">
            <strong style="color:#fff">${payment.user?.name || 'Usuario'} ${payment.user?.lastName || ''}</strong><br>
            ${payment.user?.email || 'Sin correo'}<br>
            Método: ${this.formatMethod(payment.paymentMethod)}<br>
            Estado: ${this.formatStatus(payment.status)}<br>
            Referencia: ${payment.paymentReference}<br>
            Fecha: ${new Date(payment.createdAt).toLocaleString('es-CO')}
          </p>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.15)">
                <th style="padding:0.5rem;color:rgba(255,255,255,0.5);font-weight:500;text-align:left">Artículo</th>
                <th style="padding:0.5rem;color:rgba(255,255,255,0.5);font-weight:500;text-align:right">P. Unit.</th>
                <th style="padding:0.5rem;color:rgba(255,255,255,0.5);font-weight:500;text-align:right">Subtotal</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="margin-top:1rem;padding-top:1rem;border-top:2px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;font-size:1.05rem">
            <strong style="color:#fff">Total pagado</strong>
            <strong style="color:#4ade80">${this.formatCurrency(payment.amount)}</strong>
          </div>
          ${payment.description ? `<p style="margin-top:0.75rem;color:rgba(255,255,255,0.4);font-size:0.85rem">Descripción: ${payment.description}</p>` : ''}
          ${payment.linkedOrderId ? `<p style="margin-top:0.35rem;color:rgba(255,255,255,0.4);font-size:0.85rem">Pedido asociado: #${payment.linkedOrderId} (${payment.linkedOrderStatus || 'sin estado'})</p>` : ''}
        </div>
      `,
      background: '#1a1a2e',
      color: '#f5f5f5',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#7c3aed',
      width: '620px',
    });
  }
}
