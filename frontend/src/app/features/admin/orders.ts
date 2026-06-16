import { Component, OnInit, inject, ChangeDetectorRef, NgZone, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import Swal from '../../core/utils/app-swal';
import { PaymentService } from '../../core/services/payment.service';
import { OrdersService } from '../../core/services/orders.service';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.html',
  styleUrls: ['./orders.scss'],
})
export class AdminOrdersComponent implements OnInit {
    destroyRef = inject(DestroyRef);
  private paymentService = inject(PaymentService);
  private ordersService = inject(OrdersService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  payments: any[] = [];
  loading = true;
  searchTerm = '';
  statusFilter = '';
  categoryFilter: 'ALL' | 'PRODUCTS' | 'EVENTS' | 'MEMBERSHIPS' = 'ALL';
  page = 1;
  pageSize = 10;

  setCategory(cat: 'ALL' | 'PRODUCTS' | 'EVENTS' | 'MEMBERSHIPS') {
    this.categoryFilter = cat;
    this.page = 1;
  }

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
        }), takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ payments, orders }) => {
        this.payments = this.mergePaymentsWithOrders(payments, orders).sort(
                      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                    );
          this.page = 1;
          this.cdr.detectChanges();
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
      
      const desc = (payment.description || '').toLowerCase();
      const isEvent = desc.includes('evento');
      const isNonProduct = isEvent || desc.includes('membresía') || desc.includes('membership');
      
      let matchedOrder = null;
      if (!isNonProduct) {
        matchedOrder = this.findBestMatchingOrder(payment, relatedOrders);
      }
      
      let items = (matchedOrder?.items ?? []).map((item: any) => ({
        id: item.id,
        name: item.product?.name || 'Producto',
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice || 0),
        subtotal: Number(item.subtotal || 0),
      }));

      if (isNonProduct) {
        items = [{
          id: payment.id,
          name: payment.description || (isEvent ? 'Evento' : 'Membresía'),
          quantity: 1,
          unitPrice: Number(payment.amount || 0),
          subtotal: Number(payment.amount || 0)
        }];
      }

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
      
      let matchCategory = true;
      const desc = (payment.description || '').toLowerCase();
      const isEvent = desc.includes('evento');
      const isMembership = desc.includes('membresía') || desc.includes('membership');
      const isProduct = !isEvent && !isMembership;

      if (this.categoryFilter === 'EVENTS') matchCategory = isEvent;
      else if (this.categoryFilter === 'MEMBERSHIPS') matchCategory = isMembership;
      else if (this.categoryFilter === 'PRODUCTS') matchCategory = isProduct;

      return matchSearch && matchStatus && matchCategory;
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
      PENDING_REFUND: 'Reemb. Pendiente',
    };
    return labels[status] || status || 'Sin estado';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'pending',
      COMPLETED: 'completed',
      FAILED: 'failed',
      REFUNDED: 'refunded',
      PENDING_REFUND: 'pending', // Reuses orange pending badge CSS
    };
    return map[status] || 'pending';
  }

  markAsRefunded(payment: any) {
    Swal.fire({
      title: '¿Confirmar reembolso?',
      text: 'Debes haber realizado la devolución del dinero manualmente en tu cuenta de Stripe o banco. ¿Deseas marcarlo como Reembolsado en el sistema?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4ade80',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, ya devolví el dinero',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // We do a PATCH to our new backend endpoint.
        // Assuming we need to extend paymentService if it doesn't have it natively, 
        // we can cast to any to use http directly.
        const http = (this.paymentService as any).http;
        const apiUrl = (this.paymentService as any).apiUrl;
        
        http.patch(`${apiUrl}/payments/${payment.id}/refunded`, {}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            Swal.fire('¡Actualizado!', 'El pago ha sido marcado como reembolsado.', 'success');
            this.loadPayments();
          },
          error: () => {
            Swal.fire('Error', 'No se pudo actualizar el pago.', 'error');
          }
        });
      }
    });
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
          <td colspan="3" style="padding:0.75rem;color:rgba(255,255,255,0.8);text-align:center;font-weight:500;">
            ${payment.description || 'No hay artículos asociados a este pago.'}
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
