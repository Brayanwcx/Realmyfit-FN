import { Component, OnInit, inject, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Chart from 'chart.js/auto';

// Services
import { UsersService } from '../../core/services/users.service';
import { ProductsService } from '../../core/services/products.service';
import { MembershipsService } from '../../core/services/memberships.service';
import { EventsService } from '../../core/services/events.service';
import { ReviewsService } from '../../core/services/reviews.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="welcome-banner">
      <h2>Panel de Control General</h2>
      <p>Resumen analítico y estado actual del sistema Realmyfit.</p>
    </div>

    <!-- Barra de estado -->
    <div class="dashboard-header glass">
      <div class="status-indicator">
        <div class="pulse-dot"></div>
        <span>Datos actualizados</span>
      </div>
      <div class="last-sync">
        <span>Última actualización: {{ lastUpdate | date:'mediumTime' }}</span>
        <button class="btn-refresh" (click)="loadStats()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
        </button>
      </div>
    </div>

    <!-- KPIs Row (Top 4 Metrics) -->
    <div class="kpi-row">
      <!-- Users KPI -->
      <div class="kpi-card glass hover-glow">
        <div class="kpi-header">
          <span class="kpi-title">Usuarios Totales</span>
          <div class="kpi-icon blue"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
        </div>
        <div class="kpi-body">
          <span class="kpi-value">{{ stats.users }}</span>
          <span class="kpi-trend positive"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg> Activos</span>
        </div>
      </div>

      <!-- Events KPI -->
      <div class="kpi-card glass hover-glow">
        <div class="kpi-header">
          <span class="kpi-title">Eventos Activos</span>
          <div class="kpi-icon indigo"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>
        </div>
        <div class="kpi-body">
          <span class="kpi-value">{{ stats.events }}</span>
          <span class="kpi-trend positive"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg> Próximos</span>
        </div>
      </div>

      <!-- Memberships KPI -->
      <div class="kpi-card glass hover-glow">
        <div class="kpi-header">
          <span class="kpi-title">Membresías Totales</span>
          <div class="kpi-icon purple"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg></div>
        </div>
        <div class="kpi-body">
          <span class="kpi-value">{{ stats.memberships }}</span>
          <span class="kpi-trend neutral"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg> Planes</span>
        </div>
      </div>

      <!-- Products KPI -->
      <div class="kpi-card glass hover-glow">
        <div class="kpi-header">
          <span class="kpi-title">Productos en Stock</span>
          <div class="kpi-icon pink"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.6"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg></div>
        </div>
        <div class="kpi-body">
          <span class="kpi-value">{{ stats.products }}</span>
          <span class="kpi-trend positive"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg> Catálogo</span>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="charts-row">
      <!-- Line Chart -->
      <div class="chart-container glass main-chart">
        <h3>Evolución de Ingresos (Mensual)</h3>
        <div class="canvas-wrapper">
          <canvas #lineChartCanvas></canvas>
        </div>
      </div>

      <!-- Doughnut Chart -->
      <div class="chart-container glass side-chart">
        <h3>Calificación de Reseñas</h3>
        <div class="canvas-wrapper">
          <canvas #doughnutChartCanvas></canvas>
        </div>
      </div>
    </div>
    
    <!-- Tables Row -->
    <div class="tables-row">
      <div class="table-panel glass">
        <div class="table-header">
          <h3>Reseñas Recientes</h3>
        </div>
        <div class="table-responsive">
          <table *ngIf="recentReviews.length > 0; else noReviews">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Calificación</th>
                <th>Comentario</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of recentReviews">
                <td>{{ r.user?.name || 'Usuario' }}</td>
                <td class="font-bold text-yellow">{{ r.rating }} / 5 ★</td>
                <td>{{ r.comment }}</td>
                <td class="sub-text">{{ r.createdAt | date:'shortDate' }}</td>
              </tr>
            </tbody>
          </table>
          <ng-template #noReviews><p class="empty-text">No hay reseñas registradas.</p></ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .welcome-banner { margin-bottom: 1.5rem; }
    h2 { font-size: 1.75rem; margin-bottom: 0.5rem; }
    p { color: rgba(255,255,255,0.6); }
    
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      background: rgba(255, 255, 255, 0.02);
    }
    
    .status-indicator { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 500; }
    .pulse-dot { width: 8px; height: 8px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 10px #4ade80; animation: pulse 2s infinite; }
    .pulse-dot.syncing { background: #facc15; box-shadow: 0 0 10px #facc15; animation: blink 1s infinite; }
    
    @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(74, 222, 128, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); } }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    
    .last-sync { display: flex; align-items: center; gap: 1rem; font-size: 0.75rem; color: rgba(255,255,255,0.5); }
    .btn-refresh { background: none; border: none; color: #fff; cursor: pointer; display: flex; padding: 0.25rem; border-radius: 4px; transition: 0.3s; }
    .btn-refresh:hover:not(:disabled) { background: rgba(255, 255, 255, 0.1); }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    
    /* KPIs Row */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .kpi-card {
      padding: 1.5rem;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .kpi-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
    
    .kpi-header { display: flex; justify-content: space-between; align-items: center; }
    .kpi-title { font-size: 0.9rem; color: rgba(255,255,255,0.7); font-weight: 500; }
    .kpi-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .kpi-icon.blue { background: rgba(0, 124, 240, 0.1); color: #007cf0; }
    .kpi-icon.indigo { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
    .kpi-icon.purple { background: rgba(121, 40, 202, 0.1); color: #7928ca; }
    .kpi-icon.pink { background: rgba(255, 0, 128, 0.1); color: #ff0080; }
    
    .kpi-body { display: flex; flex-direction: column; gap: 0.25rem; }
    .kpi-value { font-size: 2rem; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
    .kpi-trend { font-size: 0.8rem; display: flex; align-items: center; gap: 0.25rem; }
    .kpi-trend.positive { color: #4ade80; }
    .kpi-trend.negative { color: #ef4444; }
    .kpi-trend.neutral { color: #94a3b8; }
    
    /* Charts Row */
    .charts-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    @media (max-width: 900px) {
      .charts-row { grid-template-columns: 1fr; }
    }
    
    .chart-container {
      padding: 1.5rem;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
    }
    
    .chart-container h3 { margin: 0 0 1.5rem 0; font-size: 1.1rem; font-weight: 600; color: rgba(255,255,255,0.9); }
    
    .canvas-wrapper {
      position: relative;
      flex-grow: 1;
      width: 100%;
      min-height: 250px;
    }
    
    /* Tables Row */
    .table-panel {
      padding: 1.5rem;
      border-radius: 16px;
    }
    
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    
    .table-header h3 { margin: 0; font-size: 1.1rem; font-weight: 600; color: rgba(255,255,255,0.9); }
    
    .table-responsive { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
    th { padding: 1rem; color: rgba(255,255,255,0.5); font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.1); }
    td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.85); }
    tr:hover td { background: rgba(255,255,255,0.02); }
    
    .sub-text { color: rgba(255,255,255,0.5); font-size: 0.85rem; }
    .font-bold { font-weight: 600; }
    .text-yellow { color: #facc15; }
    
    .empty-text { font-size: 0.9rem; color: rgba(255,255,255,0.4); text-align: center; padding: 3rem 0; margin: 0; }
  `]
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('lineChartCanvas') lineChartCanvas!: ElementRef;
  @ViewChild('doughnutChartCanvas') doughnutChartCanvas!: ElementRef;

  // Services
  private usersService = inject(UsersService);
  private productsService = inject(ProductsService);
  private membershipsService = inject(MembershipsService);
  private eventsService = inject(EventsService);
  private reviewsService = inject(ReviewsService);

  lastUpdate = new Date();
  private sub?: Subscription;

  stats = {
    users: 0, products: 0, memberships: 0, events: 0, reviews: 0
  };

  recentReviews: any[] = [];
  reviewsData: any[] = [];
  monthlyRevenue: { labels: string[]; data: number[] } | null = null;

  lineChart: any;
  doughnutChart: any;

  ngOnInit() {
    // Mostrar datos inmediatamente sin loading
    this.loadStats();
    // Inicializar charts inmediatamente
    setTimeout(() => {
      this.initLineChart();
      this.initDoughnutChart();
    }, 100);
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
    console.log('🔄 Loading dashboard stats...');

    // Cargar cada servicio independientemente
    this.usersService.getUsers().pipe(catchError(() => of([]))).subscribe(users => {
      this.stats.users = users?.length || 0;
      console.log('✅ Users loaded:', this.stats.users);
    });

    this.productsService.getProducts().pipe(catchError(() => of([]))).subscribe(products => {
      this.stats.products = products?.length || 0;
      console.log('✅ Products loaded:', this.stats.products);
    });

    this.membershipsService.getMemberships().pipe(catchError(() => of([]))).subscribe(memberships => {
      this.stats.memberships = memberships?.length || 0;
      this.calculateMonthlyRevenue(memberships || []);
      console.log('✅ Memberships loaded:', this.stats.memberships);
    });

    this.eventsService.getEvents().pipe(catchError(() => of([]))).subscribe(events => {
      this.stats.events = events?.length || 0;
      console.log('✅ Events loaded:', this.stats.events);
    });

    this.reviewsService.getReviews().pipe(catchError(() => of([]))).subscribe(reviews => {
      this.stats.reviews = reviews?.length || 0;
      this.reviewsData = reviews || [];
      this.recentReviews = reviews?.slice(0, 5) || [];
      console.log('✅ Reviews loaded:', this.stats.reviews);
    });

    // Actualizar fecha de última actualización
    this.lastUpdate = new Date();
    console.log('✅ Dashboard loading complete');
  }

  calculateMonthlyRevenue(memberships: any[]) {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentYear = new Date().getFullYear();
    const monthlyRevenue: { [key: string]: number } = {};

    // Inicializar los últimos 6 meses con 0
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${months[date.getMonth()]}`;
      monthlyRevenue[monthKey] = 0;
    }

    // Calcular ingresos basados en precios de membresías
    memberships.forEach((membership: any) => {
      if (membership.price) {
        // Distribuir el precio de la membresía entre los meses
        const price = Number(membership.price);
        const monthsKeys = Object.keys(monthlyRevenue);
        monthsKeys.forEach((key, index) => {
          monthlyRevenue[key] += Math.round(price / monthsKeys.length);
        });
      }
    });

    this.monthlyRevenue = {
      labels: Object.keys(monthlyRevenue),
      data: Object.values(monthlyRevenue)
    };
  }

  initLineChart() {
    if (this.lineChart) this.lineChart.destroy();
    if (!this.lineChartCanvas) return;

    const ctx = this.lineChartCanvas.nativeElement.getContext('2d');

    // Use real data from backend or fallback to empty data
    const labels = this.monthlyRevenue?.labels || ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'];
    const data = this.monthlyRevenue?.data || [0, 0, 0, 0, 0, 0, 0];

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Ingresos Mensuales ($)',
          data: data,
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
    
    const reviews = this.reviewsData || [];
    const rating5 = reviews.filter(r => r.rating === 5).length;
    const rating4 = reviews.filter(r => r.rating === 4).length;
    const rating3 = reviews.filter(r => r.rating === 3).length;
    const ratingLower = reviews.filter(r => r.rating <= 2).length;

    const dataPoints = reviews.length > 0 
      ? [rating5, rating4, rating3, ratingLower]
      : [12, 8, 4, 1];

    this.doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Excelente (5★)', 'Muy Bueno (4★)', 'Bueno (3★)', 'Bajo (≤2★)'],
        datasets: [{
          data: dataPoints,
          backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: 'rgba(255,255,255,0.7)', padding: 20, usePointStyle: true }
          }
        }
      }
    });
  }
}





