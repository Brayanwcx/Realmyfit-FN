import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../core/services/users.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="view-header">
      <h2>Gestión de Usuarios</h2>
      <button class="btn-primary" (click)="openModal()">Nuevo Usuario</button>
    </div>
    
    <div class="table-container glass">
      @if (loading) {
        <div class="loading-state">Cargando usuarios...</div>
      }

      @if (errorMessage) {
        <div class="error-state">
          <p>Error: {{ errorMessage }}</p>
          <button class="btn-primary" (click)="fetchUsers()">Reintentar</button>
        </div>
      }
      
      @if (!loading && !errorMessage && users.length > 0) {
        <!-- Vista Desktop -->
        <table class="desktop-table">
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
            @for (user of users; track user.id) {
              <tr>
                <td>{{ user.name }} {{ user.lastName }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.docType }} {{ user.docNumber }}</td>
                <td>
                  <span class="badge" [class.badge-active]="user.isActive" [class.badge-inactive]="!user.isActive">
                    {{ user.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td>
                  <button class="btn-icon" (click)="editUser(user)">Editar</button>
                  <button class="btn-icon delete" (click)="deleteUser(user.id)">Eliminar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>

        <!-- Vista Mobile -->
        <div class="mobile-cards">
          @for (user of users; track user.id) {
            <div class="mobile-card glass">
              <div class="card-row">
                <span class="card-label">Nombre</span>
                <div class="card-value">{{ user.name }} {{ user.lastName }}</div>
              </div>
              <div class="card-row">
                <span class="card-label">Email</span>
                <div class="card-value">{{ user.email }}</div>
              </div>
              <div class="card-row">
                <span class="card-label">Documento</span>
                <div class="card-value">{{ user.docType }} {{ user.docNumber }}</div>
              </div>
              <div class="card-row">
                <span class="card-label">Estado</span>
                <div class="card-value">
                  <span class="badge" [class.badge-active]="user.isActive" [class.badge-inactive]="!user.isActive">
                    {{ user.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>
              </div>
              <div class="card-actions">
                <button class="btn-icon" (click)="editUser(user)">Editar</button>
                <button class="btn-icon delete" (click)="deleteUser(user.id)">Eliminar</button>
              </div>
            </div>
          }
        </div>
      }

      @if (!loading && !errorMessage && users.length === 0) {
        <div class="empty-state">
          No se encontraron usuarios.
        </div>
      }
    </div>

    <!-- User Modal -->
    @if (showModal) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-content glass" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}</h3>
            <button class="btn-close" (click)="closeModal()">&times;</button>
          </div>
          
          <form (ngSubmit)="submitUser()" #userForm="ngForm" class="user-form">
            <div class="form-row">
              <div class="form-group">
                <label>Nombre</label>
                <input type="text" name="name" [(ngModel)]="newUser.name" required placeholder="Nombre" class="glass-input">
              </div>
              <div class="form-group">
                <label>Apellido</label>
                <input type="text" name="lastName" [(ngModel)]="newUser.lastName" required placeholder="Apellido" class="glass-input">
              </div>
            </div>
            
            <div class="form-group">
              <label>Email</label>
              <input type="email" name="email" [(ngModel)]="newUser.email" required placeholder="correo@ejemplo.com" class="glass-input">
            </div>

            @if (!isEditing) {
              <div class="form-group">
                <label>Contraseña</label>
                <input type="password" name="password" [(ngModel)]="newUser.password" required placeholder="Mínimo 6 caracteres" class="glass-input">
              </div>
            }
            
            <div class="form-row">
              <div class="form-group">
                <label>Tipo Documento</label>
                <select name="docType" [(ngModel)]="newUser.docType" class="glass-input">
                  <option value="CC">CC</option>
                  <option value="TI">TI</option>
                  <option value="CE">CE</option>
                  <option value="PP">PP</option>
                </select>
              </div>
              <div class="form-group">
                <label>Número Documento</label>
                <input type="text" name="docNumber" [(ngModel)]="newUser.docNumber" required placeholder="1234567890" class="glass-input">
              </div>
            </div>

            <div class="form-group">
              <label>Roles</label>
              <div class="checkbox-group">
                <label class="checkbox-item">
                  <input type="checkbox" name="roleUser" [(ngModel)]="newUser.hasUserRole">
                  Usuario
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" name="roleAdmin" [(ngModel)]="newUser.hasAdminRole">
                  Administrador
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" name="roleTrainer" [(ngModel)]="newUser.hasTrainerRole">
                  Entrenador
                </label>
              </div>
            </div>

            <div class="form-options">
              <label class="checkbox-container">
                <input type="checkbox" name="isActive" [(ngModel)]="newUser.isActive">
                Usuario activo
              </label>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="!userForm.valid || isSubmitting">
                {{ isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Usuario') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .table-container { padding: 1rem; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 1rem; color: rgba(255,255,255,0.6); font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.1); }
    td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .loading-state, .empty-state, .error-state { padding: 3rem; text-align: center; color: rgba(255,255,255,0.5); }
    .error-state { color: #ff4d4d; }
    
    .badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .badge-active { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
    .badge-inactive { background: rgba(255, 77, 77, 0.2); color: #ff4d4d; }
    
    .btn-icon { background: none; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.4rem 0.8rem; border-radius: 8px; cursor: pointer; margin-right: 0.5rem; transition: 0.3s; font-size: 0.75rem; }
    .btn-icon:hover { background: rgba(255,255,255,0.05); }
    .btn-icon.delete:hover { border-color: #ff4d4d; color: #ff4d4d; }

    /* Modal Styles */
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
      display: flex; justify-content: center; align-items: center;
      z-index: 1000; padding: 1rem;
    }

    .modal-content {
      width: 100%; max-width: 500px; padding: 2rem; position: relative;
      max-height: 90vh; overflow-y: auto; box-sizing: border-box; border-radius: 16px;
    }

    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; h3 { margin: 0; font-size: 1.5rem; } }
    .btn-close { background: none; border: none; color: #fff; font-size: 1.5rem; cursor: pointer; }

    /* Form Styles */
    .user-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; label { font-size: 0.85rem; color: rgba(255,255,255,0.6); } }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .glass-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.75rem; color: #fff; font-family: inherit; outline: none; transition: 0.3s; box-sizing: border-box; width: 100%; &:focus { border-color: var(--color-primary, #27ae60); background: rgba(255,255,255,0.08); } }
    select.glass-input { appearance: none; cursor: pointer; }
    select.glass-input option { background: #1e1e1e; color: #fff; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
    .btn-secondary { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; transition: 0.3s; &:hover { background: rgba(255,255,255,0.1); } }
    .checkbox-container { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.85rem; color: rgba(255,255,255,0.8); }
    .checkbox-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .checkbox-item { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.85rem; color: rgba(255,255,255,0.8); }
    .checkbox-item input[type="checkbox"] { cursor: pointer; }

    .mobile-cards { display: none; }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .view-header { flex-direction: column; align-items: stretch; gap: 1rem; }
      .view-header button { width: 100%; }
      .modal-content { padding: 1.5rem; }
      
      .desktop-table { display: none; }
      .mobile-cards { display: flex; flex-direction: column; gap: 1.5rem; }
      
      .mobile-card {
        padding: 1rem;
        background: rgba(255,255,255,0.02);
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.05);
      }
      
      .card-row {
        display: flex; justify-content: space-between; align-items: center;
        padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);
      }
      
      .card-label { font-weight: 500; color: rgba(255,255,255,0.6); }
      .card-value { color: white; text-align: right; font-weight: 500; }
      
      .card-actions { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; }
      .card-actions .btn-icon { width: 100%; margin: 0; text-align: center; padding: 0.75rem; }
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  private usersService = inject(UsersService);
  private cdr = inject(ChangeDetectorRef);
  
  users: any[] = [];
  loading = true;
  errorMessage = '';
  
  showModal = false;
  isSubmitting = false;
  isEditing = false;
  editingUserId: number | null = null;
  
  newUser: any = {
    name: '',
    lastName: '',
    email: '',
    password: '',
    docType: 'CC',
    docNumber: '',
    isActive: true,
    hasUserRole: true,
    hasAdminRole: false,
    hasTrainerRole: false
  };

  ngOnInit() {
    this.fetchUsers();
  }

  fetchUsers() {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.usersService.getUsers()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.users = data;
        },
        error: (err) => {
          console.error('Error fetching users', err);
          this.errorMessage = err.status === 401 ? 'No autorizado. Por favor inicia sesión como admin.' : (err.message || 'Error de conexión');
        }
      });
  }

  openModal() {
    this.showModal = true;
    this.isEditing = false;
    this.editingUserId = null;
    this.newUser = {
      name: '', lastName: '', email: '', password: '',
      docType: 'CC', docNumber: '', isActive: true,
      hasUserRole: true,
      hasAdminRole: false,
      hasTrainerRole: false
    };
  }

  editUser(user: any) {
    this.showModal = true;
    this.isEditing = true;
    this.editingUserId = user.id;
    this.newUser = {
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      password: '',
      docType: user.docType || 'CC',
      docNumber: user.docNumber || '',
      isActive: user.isActive,
      hasUserRole: user.roles?.some((r: any) => r.name === 'USER') || false,
      hasAdminRole: user.roles?.some((r: any) => r.name === 'ADMIN') || false,
      hasTrainerRole: user.roles?.some((r: any) => r.name === 'TRAINER') || false
    };
  }

  closeModal() {
    this.showModal = false;
  }

  submitUser() {
    this.isSubmitting = true;

    const dataToSave: any = { ...this.newUser };

    // Convert checkboxes to roleIds array
    const roleIds: number[] = [];
    if (dataToSave.hasUserRole) roleIds.push(2); // USER role id
    if (dataToSave.hasAdminRole) roleIds.push(1); // ADMIN role id
    if (dataToSave.hasTrainerRole) roleIds.push(3); // TRAINER role id
    dataToSave.roleIds = roleIds;

    // Remove checkbox fields
    delete dataToSave.hasUserRole;
    delete dataToSave.hasAdminRole;
    delete dataToSave.hasTrainerRole;

    // Don't send empty password on edit
    if (this.isEditing && !dataToSave.password) {
      delete dataToSave.password;
    }

    if (this.isEditing && this.editingUserId) {
      this.usersService.updateUser(this.editingUserId, dataToSave).subscribe({
        next: () => this.onSaveSuccess(),
        error: (err) => this.onSaveError(err)
      });
    } else {
      this.usersService.createUser(dataToSave).subscribe({
        next: () => this.onSaveSuccess(),
        error: (err) => this.onSaveError(err)
      });
    }
  }

  private onSaveSuccess() {
    this.isSubmitting = false;
    this.closeModal();
    this.fetchUsers();
  }

  private onSaveError(err: any) {
    console.error('Error saving user', err);
    alert('Error al guardar el usuario');
    this.isSubmitting = false;
  }

  deleteUser(id: number) {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      this.usersService.deleteUser(id).subscribe({
        next: () => this.fetchUsers(),
        error: (err) => console.error('Error deleting user', err)
      });
    }
  }
}
