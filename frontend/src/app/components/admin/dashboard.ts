import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../services/users.service';
import { ProductsService } from '../../services/products.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="welcome-banner">
      <h2>Bienvenido de nuevo, Administrador</h2>
      <p>Aquí tienes un resumen en tiempo real de Realmyfit.</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card glass">
        <div class="stat-info">
          <span class="stat-label">Usuarios Registrados</span>
          <span class="stat-value">{{ userCount }}</span>
        </div>
        <div class="stat-visual blue"></div>
      </div>

      <div class="stat-card glass">
        <div class="stat-info">
          <span class="stat-label">Catálogo de Productos</span>
          <span class="stat-value">{{ productCount }}</span>
        </div>
        <div class="stat-visual pink"></div>
      </div>

      <div class="stat-card glass">
        <div class="stat-info">
          <span class="stat-label">Sedes Activas</span>
          <span class="stat-value">1</span>
        </div>
        <div class="stat-visual purple"></div>
      </div>
    </div>

    <div class="dashboard-footer-info glass">
      <p>Sincronizado con el backend en: {{ lastUpdate | date:'mediumTime' }}</p>
    </div>
  `,
  styles: [`
    .welcome-banner { margin-bottom: 2rem; }
    h2 { font-size: 1.75rem; margin-bottom: 0.5rem; }
    p { color: rgba(255,255,255,0.6); }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .stat-card {
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 120px;
    }
    
    .stat-label { display: block; font-size: 0.85rem; color: rgba(255,255,255,0.5); margin-bottom: 0.5rem; }
    .stat-value { display: block; font-size: 2rem; font-weight: 700; }
    
    .stat-visual { width: 56px; height: 56px; border-radius: 14px; opacity: 0.2; }
    .stat-visual.blue { background: #007cf0; box-shadow: 0 0 20px #007cf0; }
    .stat-visual.pink { background: #ff0080; box-shadow: 0 0 20px #ff0080; }
    .stat-visual.purple { background: #7928ca; box-shadow: 0 0 20px #7928ca; }

    .dashboard-footer-info { padding: 1rem; text-align: right; font-size: 0.75rem; color: rgba(255,255,255,0.4); }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private usersService = inject(UsersService);
  private productsService = inject(ProductsService);

  userCount = 0;
  productCount = 0;
  lastUpdate = new Date();

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    forkJoin({
      users: this.usersService.getUsers(),
      products: this.productsService.getProducts()
    }).subscribe({
      next: (res) => {
        this.userCount = res.users.length;
        this.productCount = res.products.length;
        this.lastUpdate = new Date();
      },
      error: (err) => console.error('Error loading dashboard stats', err)
    });
  }
}
