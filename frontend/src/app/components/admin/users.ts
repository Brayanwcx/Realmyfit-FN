import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="view-header">
      <h2>Gestión de Usuarios</h2>
      <button class="btn-primary">Nuevo Usuario</button>
    </div>
    
    <div class="table-container glass">
      <div *ngIf="loading" class="loading-state">Cargando usuarios...</div>
      
      <div *ngIf="errorMessage" class="error-state">
        <p>Error: {{ errorMessage }}</p>
        <button class="btn-primary" (click)="fetchUsers()">Reintentar</button>
      </div>

      <table *ngIf="!loading && !errorMessage && users.length > 0">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Documento</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let user of users">
            <td>{{ user.name }} {{ user.lastName }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.docType }} {{ user.docNumber }}</td>
            <td>
              <span class="badge" [class.active]="user.isActive">
                {{ user.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>
              <button class="btn-icon">Editar</button>
              <button class="btn-icon delete">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div *ngIf="!loading && users.length === 0" class="empty-state">
        No se encontraron usuarios.
      </div>
    </div>
  `,
  styles: [`
    .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .table-container { padding: 1rem; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 1rem; color: rgba(255,255,255,0.6); font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.1); }
    td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; background: rgba(255,255,255,0.1); }
    .badge.active { background: rgba(0, 255, 128, 0.2); color: #00ff80; }
    .loading-state, .empty-state, .error-state { padding: 3rem; text-align: center; color: rgba(255,255,255,0.5); }
    .error-state { color: #ff4d4d; }
    .btn-icon { background: none; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.4rem 0.8rem; border-radius: 8px; cursor: pointer; margin-right: 0.5rem; transition: 0.3s; font-size: 0.75rem; }
    .btn-icon:hover { background: rgba(255,255,255,0.05); }
    .btn-icon.delete:hover { border-color: #ff4d4d; color: #ff4d4d; }
  `]
})
export class AdminUsersComponent implements OnInit {
  private usersService = inject(UsersService);
  users: any[] = [];
  loading = true;
  errorMessage = '';

  ngOnInit() {
    this.fetchUsers();
  }

  fetchUsers() {
    this.loading = true;
    this.errorMessage = '';
    this.usersService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching users', err);
        this.errorMessage = err.status === 401 ? 'No autorizado. Por favor inicia sesión como admin.' : (err.message || 'Error de conexión');
        this.loading = false;
      }
    });
  }
}
