import { Component, OnInit, inject, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Chart from 'chart.js/auto';

// Services
import { UsersService } from '../../core/services/users.service';
import { ProductsService } from '../../core/services/products.service';
import { MembershipsService } from '../../core/services/memberships.service';
import { OrdersService } from '../../core/services/orders.service';
import { MachinesService } from '../../core/services/machines.service';

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
        <div class="pulse-dot" [class.syncing]="loading"></div>
        <span>{{ loading ? 'Sincronizando datos...' : 'Datos actualizados' }}</span>
      </div>
      <div class="last-sync">
        <span>Última actualización: {{ lastUpdate | date:'mediumTime' }}</span>
        <button class="btn-refresh" (click)="loadStats()" [disabled]="loading">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class.spin]="loading"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
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
          <span class="kpi-trend positive"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg> +12% este mes</span>
        </div>
      </div>

      <!-- Orders KPI -->
      <div class="kpi-card glass hover-glow">
        <div class="kpi-header">
          <span class="kpi-title">Órdenes Activas</span>
          <div class="kpi-icon indigo"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg></div>
        </div>
        <div class="kpi-body">
          <span class="kpi-value">{{ stats.orders }}</span>
          <span class="kpi-trend positive"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg> +5 nuevas hoy</span>
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
          <span class="kpi-trend neutral"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg> Estable</span>
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
          <span class="kpi-trend negative"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline></svg> -2 agotados</span>
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
        <h3>Estado de Máquinas</h3>
        <div class="canvas-wrapper">
          <canvas #doughnutChartCanvas></canvas>
        </div>
      </div>
    </div>
    
    <!-- Tables Row -->
    <div class="tables-row">
      <div class="table-panel glass">
        <div class="table-header">
          <h3>Órdenes Recientes</h3>
          <button class="btn-view-all">Ver Todas</button>
        </div>
        <div class="table-responsive">
          <table *ngIf="recentOrders.length > 0; else noOrders">
            <thead>
              <tr>
                <th>ID Orden</th>
                <th>Usuario</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let o of recentOrders">
                <td class="order-id">#{{ o.id || '---' }}</td>
                <td>{{ o.user?.name || 'Cliente' }}</td>
                <td class="sub-text">{{ o.createdAt | date:'shortDate' }}</td>
                <td class="font-bold">\${{ o.totalAmount || '0.00' }}</td>
                <td><span class="badge" [class.badge-success]="o.status === 'COMPLETED'" [class.badge-pending]="o.status !== 'COMPLETED'">{{ o.status || 'PENDIENTE' }}</span></td>
              </tr>
            </tbody>
          </table>
          <ng-template #noOrders><p class="empty-text">No hay órdenes registradas.</p></ng-template>
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
    .btn-view-all { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 0.4rem 1rem; border-radius: 6px; cursor: pointer; transition: 0.2s; font-size: 0.85rem; }
    .btn-view-all:hover { background: rgba(255,255,255,0.1); }
    
    .table-responsive { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
    th { padding: 1rem; color: rgba(255,255,255,0.5); font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.1); }
    td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.85); }
    tr:hover td { background: rgba(255,255,255,0.02); }
    
    .order-id { font-family: monospace; color: #a855f7; font-weight: 600; }
    .sub-text { color: rgba(255,255,255,0.5); font-size: 0.85rem; }
    .font-bold { font-weight: 600; }
    
    .badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; display: inline-block; }
    .badge-success { background: rgba(34, 197, 94, 0.1); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.2); }
    .badge-pending { background: rgba(245, 158, 11, 0.1); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
    
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
  private ordersService = inject(OrdersService);
  private machinesService = inject(MachinesService);

  loading = true;
  lastUpdate = new Date();
  private sub?: Subscription;

  stats = {
    users: 0, products: 0, memberships: 0, orders: 0
  };
  
  recentOrders: any[] = [];
  machinesData: any[] = [];

  lineChart: any;
  doughnutChart: any;

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
    const safeCall = (observable: any) => observable.pipe(catchError(() => of([])));

    this.sub = forkJoin({
      users: safeCall(this.usersService.getUsers()),
      products: safeCall(this.productsService.getProducts()),
      memberships: safeCall(this.membershipsService.getMemberships()),
      orders: safeCall(this.ordersService.getOrders()),
      machines: safeCall(this.machinesService.getMachines()),
    }).subscribe({
      next: (res: any) => {
        this.stats = {
          users: res.users?.length || 0,
          products: res.products?.length || 0,
          memberships: res.memberships?.length || 0,
          orders: res.orders?.length || 0
        };
        
        if(res.orders) this.recentOrders = res.orders.slice(0, 5);
        if(res.machines) this.machinesData = res.machines;
        
        this.lastUpdate = new Date();
        this.loading = false;

        // Render charts after data is ready
        setTimeout(() => {
          this.initLineChart();
          this.initDoughnutChart();
        }, 100);
      },
      error: (err) => {
        console.error('Error loading dashboard stats', err);
        this.loading = false;
      }
    });
  }

  initLineChart() {
    if (this.lineChart) this.lineChart.destroy();
    if (!this.lineChartCanvas) return;

    const ctx = this.lineChartCanvas.nativeElement.getContext('2d');
    
    // Mocked data for the line chart (In a real scenario, map this from API data)
    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
        datasets: [{
          label: 'Ingresos Mensuales ($)',
          data: [1200, 1900, 1500, 2200, 1800, 2500, 3100],
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
    
    // Calculate machines status
    const activeMachines = this.machinesData.filter(m => m.status === 'AVAILABLE' || m.status === 'ACTIVA').length || 15;
    const maintenanceMachines = this.machinesData.filter(m => m.status === 'MAINTENANCE' || m.status === 'MANTENIMIENTO').length || 3;

    this.doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Operativas', 'En Mantenimiento'],
        datasets: [{
          data: [activeMachines, maintenanceMachines],
          backgroundColor: ['#22c55e', '#f59e0b'],
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




