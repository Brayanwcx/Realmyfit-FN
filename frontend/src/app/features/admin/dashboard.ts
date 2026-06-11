import { Component, OnInit, inject, OnDestroy, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Chart from 'chart.js/auto';

// Services
import { UsersService } from '../../core/services/users.service';
import { ProductsService } from '../../core/services/products.service';
import { MembershipsService } from '../../core/services/memberships.service';
import { ReviewsService } from '../../core/services/reviews.service';
import { OrdersService } from '../../core/services/orders.service';
import { PaymentService } from '../../core/services/payment.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('lineChartCanvas') lineChartCanvas!: ElementRef;
  @ViewChild('doughnutChartCanvas') doughnutChartCanvas!: ElementRef;

  // Services
  private usersService = inject(UsersService);
  private productsService = inject(ProductsService);
  private membershipsService = inject(MembershipsService);
  private reviewsService = inject(ReviewsService);
  private ordersService = inject(OrdersService);
  private paymentService = inject(PaymentService);
  
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  loading = true;
  lastUpdate = new Date();
  private sub?: Subscription;

  stats = {
    users: 0, products: 0, memberships: 0, orders: 0
  };
  
  allOrders: any[] = [];
  allPayments: any[] = [];
  recentOrders: any[] = [];
  reviewsData: any[] = [];

  lineChart: any;
  doughnutChart: any;

  translateStatus(status: string): string {
    if (!status) return 'Pendiente';
    const st = status.toUpperCase();
    if (st === 'COMPLETED' || st === 'COMPLETADO') return 'Completado';
    if (st === 'CANCELLED' || st === 'CANCELADO') return 'Cancelado';
    return 'Pendiente';
  }

  ngOnInit() {
    this.loadStats();
  }
  
  ngAfterViewInit() {
    // Charts are initialized after stats are loaded
  }
  
  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if (this.lineChart) this.lineChart.destroy();
    if (this.doughnutChart) this.doughnutChart.destroy();
  }

  loadStats() {
    this.loading = true;
    this.cdr.detectChanges();

    const safeCall = (observable: any) => observable.pipe(catchError((err) => {
      console.error('Error fetching resource:', err);
      return of([]);
    }));

    this.sub = forkJoin({
      users: safeCall(this.usersService.getUsers()),
      products: safeCall(this.productsService.getProducts()),
      memberships: safeCall(this.membershipsService.getMemberships()),
      orders: safeCall(this.ordersService.getOrders()),
      reviews: safeCall(this.reviewsService.getReviews()),
      payments: safeCall(this.paymentService.getPayments()),
    }).subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          this.stats = {
            users: res.users?.length || 0,
            products: res.products?.length || 0,
            memberships: res.memberships?.length || 0,
            orders: res.orders?.length || 0
          };
          
          if(res.orders && Array.isArray(res.orders)) {
            this.allOrders = res.orders;
          }

          if(res.payments && Array.isArray(res.payments)) {
             this.allPayments = res.payments;
             const sortedPayments = [...res.payments].sort((a, b) => 
               new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
             );
             this.recentOrders = sortedPayments.slice(0, 5);
          } else {
             this.recentOrders = [];
          }

          if(res.reviews) this.reviewsData = res.reviews;
          
          this.lastUpdate = new Date();
          this.loading = false;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.initLineChart();
            this.initDoughnutChart();
          }, 100);
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Error loading dashboard stats', err);
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  initLineChart() {
    if (this.lineChart) this.lineChart.destroy();
    if (!this.lineChartCanvas) return;

    const ctx = this.lineChartCanvas.nativeElement.getContext('2d');
    
    // Compute total revenues per month for the current year based on ORDERS.
    // Only count orders that are CONFIRMED, COMPLETED, or DELIVERED.
    // CANCELLED and PENDING orders are excluded from revenue.
    const VALID_STATUSES = ['CONFIRMED', 'COMPLETED', 'COMPLETADO', 'DELIVERED', 'ENTREGADO'];
    const currentYear = new Date().getFullYear();
    const monthlyIncome = new Array(12).fill(0);
    
    this.allOrders.forEach(order => {
      const st = (order.status || '').toUpperCase();
      if (VALID_STATUSES.includes(st)) {
        const dateString = order.createdAt || order.created_at;
        if (dateString) {
          const date = new Date(dateString);
          if (date.getFullYear() === currentYear) {
            const monthIndex = date.getMonth(); // 0-11
            const amount = typeof order.totalAmount === 'number'
              ? order.totalAmount
              : parseFloat(order.totalAmount || '0');
            monthlyIncome[monthIndex] += amount;
          }
        }
      }
    });

    const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: monthLabels,
        datasets: [{
          label: 'Ingresos Mensuales ' + currentYear + ' ($)',
          data: monthlyIncome,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#8b5cf6',
          pointBorderWidth: 2,
          pointRadius: 4,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: 'rgba(255,255,255,0.5)' }
          },
          x: { 
            grid: { display: false },
            ticks: { color: 'rgba(255,255,255,0.5)' }
          }
        }
      }
    });
  }

  initDoughnutChart() {
    if (this.doughnutChart) this.doughnutChart.destroy();
    if (!this.doughnutChartCanvas) return;

    const ctx = this.doughnutChartCanvas.nativeElement.getContext('2d');

    // Count how many reviews per star rating (1–5)
    const ratingCounts = [1, 2, 3, 4, 5].map(star =>
      this.reviewsData.filter((r: any) => Math.round(r.rating) === star).length
    );
    const hasData = ratingCounts.some(c => c > 0);
    const finalCounts = hasData ? ratingCounts : [1, 2, 5, 8, 4]; // fallback demo

    this.doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['⭐ 1 Estrella', '⭐⭐ 2', '⭐⭐⭐ 3', '⭐⭐⭐⭐ 4', '⭐⭐⭐⭐⭐ 5'],
        datasets: [{
          data: finalCounts,
          backgroundColor: ['#ef4444', '#f97316', '#facc15', '#84cc16', '#22c55e'],
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: 'rgba(255,255,255,0.7)', padding: 12, usePointStyle: true, font: { size: 11 } }
          }
        }
      }
    });
  }
}




