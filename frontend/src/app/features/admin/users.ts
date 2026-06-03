import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../core/services/users.service';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="view-header">
      <h2>Gestión de Usuarios</h2>
      <button class="btn-primary" (click)="openModal()">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
        Nuevo Usuario
      </button>
    </div>
    
    <div class="table-container glass">
      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando usuarios...</p>
        </div>
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
              <th>Usuario</th>
              <th>Contacto</th>
              <th>Documento</th>
              <th width="100px">Rol</th>
              <th width="100px">Estado</th>
              <th width="180px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (user of pagedUsers; track user.id) {
              <tr>
                <td>
                  <div class="product-name">{{ user.name }} {{ user.lastName }}</div>
                </td>
                <td>
                  <div class="product-desc">{{ user.email }}</div>
                </td>
                <td>
                  <div class="product-desc">{{ user.docType }}: {{ user.docNumber }}</div>
                </td>
                <td>
                  <span class="badge category-badge">
                    {{ user.roles && user.roles.length > 0 ? user.roles[0].name : 'N/A' }}
                  </span>
                </td>
                <td>
                  <span class="badge" [class.badge-active]="user.isActive" [class.badge-inactive]="!user.isActive">
                    {{ user.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="btn-icon" (click)="editUser(user)" title="Editar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      Editar
                    </button>
                    <button class="btn-icon delete" (click)="deleteUser(user.id)" title="Eliminar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>

        <!-- Vista Mobile -->
        <div class="mobile-cards">
          @for (user of pagedUsers; track user.id) {
            <div class="mobile-card glass">
              <div class="card-header">
                <div class="card-title" style="margin-left: 0;">
                  <h4>{{ user.name }} {{ user.lastName }}</h4>
                  <span class="badge category-badge">{{ user.roles && user.roles.length > 0 ? user.roles[0].name : 'N/A' }}</span>
                </div>
              </div>
              <div class="card-row">
                <span class="card-label">Email</span>
                <div class="card-value">{{ user.email }}</div>
              </div>
              <div class="card-row">
                <span class="card-label">Documento</span>
                <div class="card-value">{{ user.docType }}: {{ user.docNumber }}</div>
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
            <span class="page-info">{{ (page-1)*pageSize+1 }}–{{ min(page*pageSize, users.length) }} de {{ users.length }}</span>
          </div>
        }
      }

      @if (!loading && !errorMessage && users.length === 0) {
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <p>No se encontraron usuarios registrados.</p>
        </div>
      }
    </div>

    <!-- Modal Formulario -->
    @if (showModal) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-content glass" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}</h3>
            <button class="btn-close" (click)="closeModal()">&times;</button>
          </div>
          
          <form (ngSubmit)="submitUser()" #userForm="ngForm" class="product-form">
            <div class="form-grid">
              
              <!-- Left Column -->
              <div class="form-column">
                <div class="form-row">
                  <div class="form-group">
                    <label>Nombre *</label>
                    <input type="text" name="name" [(ngModel)]="newUser.name" required placeholder="Nombres" class="glass-input">
                  </div>
                  <div class="form-group">
                    <label>Apellido *</label>
                    <input type="text" name="lastName" [(ngModel)]="newUser.lastName" required placeholder="Apellidos" class="glass-input">
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label>Tipo Documento *</label>
                    <select name="docType" [(ngModel)]="newUser.docType" required class="glass-input">
                      <option value="">Seleccionar...</option>
                      <option value="CC">Cédula de Ciudadanía</option>
                      <option value="TI">Tarjeta de Identidad</option>
                      <option value="CE">Cédula de Extranjería</option>
                      <option value="Pasaporte">Pasaporte</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Número Documento *</label>
                    <input type="text" name="docNumber" [(ngModel)]="newUser.docNumber" required placeholder="12345678" class="glass-input">
                  </div>
                </div>

                <div class="form-group">
                  <label>Correo Electrónico *</label>
                  <input type="email" name="email" [(ngModel)]="newUser.email" required placeholder="ejemplo@correo.com" class="glass-input">
                </div>
              </div>

              <!-- Right Column -->
              <div class="form-column">
                <div class="form-group">
                  <label>Contraseña {{ isEditing ? '(Dejar en blanco para no cambiar)' : '*' }}</label>
                  <input type="password" name="password" [(ngModel)]="newUser.password" [required]="!isEditing" placeholder="******" class="glass-input">
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Rol de Usuario *</label>
                    <select name="roleId" [(ngModel)]="newUser.roleId" required class="glass-input">
                      <option value="">Seleccionar...</option>
                      <option value="1">Administrador</option>
                      <option value="2">Usuario / Cliente</option>
                    </select>
                  </div>
                  <div class="form-group" style="padding-top: 1.5rem;">
                    <div class="toggle-switch">
                      <input type="checkbox" id="isActive" name="isActive" [(ngModel)]="newUser.isActive">
                      <label for="isActive">Cuenta Activa</label>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
  
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="!userForm.valid || isSubmitting">
                @if(isSubmitting) {
                  <span class="spinner-small"></span> Guardando...
                } @else {
                  {{ isEditing ? 'Guardar Cambios' : 'Crear Usuario' }}
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .view-header h2 { font-size: 1.8rem; margin: 0; font-weight: 700; background: linear-gradient(to right, #fff, rgba(255,255,255,0.7)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    
    .btn-primary { display: inline-flex; align-items: center; justify-content: center; background: var(--color-primary, #22c55e); color: #000; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3); }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
    
    .table-container { padding: 1.5rem; overflow-x: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
    .desktop-table { width: 100%; min-width: 800px; border-collapse: separate; border-spacing: 0; text-align: left; }
    .desktop-table th { padding: 1rem; color: rgba(255,255,255,0.6); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .desktop-table td { padding: 1.2rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; }
    
    .loading-state, .empty-state, .error-state { padding: 4rem 2rem; text-align: center; color: rgba(255,255,255,0.5); display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .empty-state svg { color: rgba(255,255,255,0.2); }
    .error-state { color: #ff4d4d; }
    
    .product-name { font-weight: 600; font-size: 1.05rem; color: #fff; margin-bottom: 0.25rem; }
    .product-desc { font-size: 0.85rem; color: rgba(255,255,255,0.5); line-height: 1.4; }
    .font-bold { font-weight: 700; color: #fff; }
    
    .badge { padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.5px; display: inline-block; }
    .category-badge { background: rgba(255,255,255,0.1); color: #fff; }
    .badge-active, .badge-good { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
    .badge-inactive, .badge-low { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    
    .actions-cell { display: flex; gap: 0.5rem; }
    .btn-icon { display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.5rem 0.8rem; border-radius: 8px; cursor: pointer; transition: 0.3s; font-size: 0.8rem; font-weight: 500; }
    .btn-icon:hover { background: rgba(255,255,255,0.1); }
    .btn-icon.delete:hover { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #f87171; }

    /* Modal Styles */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 1rem; }
    .modal-content { width: 100%; max-width: 850px; padding: 2.5rem; position: relative; max-height: 95vh; overflow-y: auto; box-sizing: border-box; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1rem; }
    .modal-header h3 { margin: 0; font-size: 1.5rem; font-weight: 700; }
    .btn-close { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 1.2rem; cursor: pointer; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
    .btn-close:hover { background: rgba(255,255,255,0.1); transform: scale(1.05); }

    /* Form Styles */
    .product-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .form-column { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.6rem; }
    .form-group label { font-size: 0.9rem; font-weight: 500; color: rgba(255,255,255,0.8); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    
    .glass-input { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.85rem 1rem; color: #fff; font-family: inherit; font-size: 0.95rem; outline: none; transition: 0.3s; box-sizing: border-box; width: 100%; }
    .glass-input:focus { border-color: var(--color-primary, #22c55e); background: rgba(255,255,255,0.06); box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1); }
    select.glass-input { appearance: none; background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E"); background-repeat: no-repeat; background-position: right 1rem top 50%; background-size: 0.65rem auto; padding-right: 2.5rem; }
    select.glass-input option { background: #1a1c20; color: #fff; }
    
    .toggle-switch { display: flex; align-items: center; gap: 0.75rem; height: 100%; padding: 0.5rem 0; }
    .toggle-switch input[type="checkbox"] { width: 44px; height: 24px; appearance: none; background: rgba(255,255,255,0.1); border-radius: 12px; position: relative; cursor: pointer; outline: none; transition: 0.3s; }
    .toggle-switch input[type="checkbox"]::after { content: ''; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: 0.3s; }
    .toggle-switch input[type="checkbox"]:checked { background: var(--color-primary, #22c55e); }
    .toggle-switch input[type="checkbox"]:checked::after { transform: translateX(20px); }
    .toggle-switch label { font-size: 0.9rem; color: rgba(255,255,255,0.8); cursor: pointer; }

    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); }
    .btn-secondary { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 500; transition: 0.3s; }
    .btn-secondary:hover { background: rgba(255,255,255,0.1); }
    
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--color-primary, #22c55e); border-radius: 50%; animation: spin 1s linear infinite; }
    .spinner-small { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.1); border-top-color: #000; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 0.5rem; vertical-align: middle; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .pagination { display: flex; align-items: center; gap: 0.4rem; justify-content: center; padding: 1.5rem 0 0.5rem; flex-wrap: wrap; }
    .page-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: 0.2s; display: inline-flex; align-items: center; justify-content: center; }
    .page-btn:hover:not(:disabled) { background: rgba(255,255,255,0.12); }
    .page-btn.active { background: var(--color-primary, #22c55e); color: #000; font-weight: 700; border-color: transparent; }
    .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .page-info { font-size: 0.8rem; color: rgba(255,255,255,0.45); margin-left: 0.5rem; }

    .mobile-cards { display: none; }

    /* Mobile Responsive */
    @media (max-width: 992px) {
      .form-grid { grid-template-columns: 1fr; gap: 1.5rem; }
    }

    @media (max-width: 768px) {
      .view-header { flex-direction: column; align-items: stretch; gap: 1rem; }
      .view-header button { justify-content: center; }
      .form-row { grid-template-columns: 1fr; }
      .modal-content { padding: 1.5rem; }
      
      .desktop-table { display: none; }
      .mobile-cards { display: flex; flex-direction: column; gap: 1rem; }
      
      .mobile-card { padding: 1.25rem; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
      .card-header { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .card-title h4 { margin: 0 0 0.5rem 0; font-size: 1.1rem; }
      .card-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; }
      .card-label { font-size: 0.85rem; color: rgba(255,255,255,0.6); }
      .card-value { color: white; font-weight: 500; }
      .card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); }
      .card-actions .btn-icon { justify-content: center; margin: 0; padding: 0.75rem; }
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  private usersService = inject(UsersService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  
  users: any[] = [];
  loading = true;
  errorMessage = '';
  page = 1;
  pageSize = 10;

  get totalPages() { return Math.ceil(this.users.length / this.pageSize); }
  get pagedUsers() { return this.users.slice((this.page-1)*this.pageSize, this.page*this.pageSize); }
  get pageNumbers() { return Array.from({length: this.totalPages}, (_, i) => i + 1); }
  min(a: number, b: number) { return Math.min(a, b); }
  
  showModal = false;
  isSubmitting = false;
  isEditing = false;
  editingId: number | null = null;
  
  newUser: any = {
    name: '',
    lastName: '',
    docType: '',
    docNumber: '',
    email: '',
    password: '',
    isActive: true,
    roleId: ''
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
          this.ngZone.run(() => {
            this.users = data;
            this.page = 1;
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Error fetching users:', err);
            this.errorMessage = err.status === 401 ? 'No autorizado.' : 'Error de conexión con el servidor.';
            this.cdr.detectChanges();
          });
        }
      });
  }

  openModal() {
    this.showModal = true;
    this.isEditing = false;
    this.editingId = null;
    this.newUser = { 
      name: '', lastName: '', docType: '', docNumber: '', email: '', password: '', isActive: true, roleId: '2'
    };
  }

  editUser(user: any) {
    this.showModal = true;
    this.isEditing = true;
    this.editingId = user.id;
    this.newUser = { 
      name: user.name,
      lastName: user.lastName,
      docType: user.docType,
      docNumber: user.docNumber,
      email: user.email,
      password: '',
      isActive: user.isActive,
      roleId: user.roles && user.roles.length > 0 ? user.roles[0].id.toString() : '2'
    };
  }

  closeModal() {
    this.showModal = false;
  }

  submitUser() {
    this.isSubmitting = true;
    
    const dataToSave: any = {
      name: this.newUser.name,
      lastName: this.newUser.lastName,
      docType: this.newUser.docType,
      docNumber: this.newUser.docNumber,
      email: this.newUser.email,
      isActive: this.newUser.isActive,
      roleIds: [Number(this.newUser.roleId)]
    };

    if (this.newUser.password) {
      dataToSave.password = this.newUser.password;
    }

    if (this.isEditing && this.editingId) {
      this.usersService.updateUser(this.editingId, dataToSave).subscribe({
        next: () => this.ngZone.run(() => this.onSaveSuccess()),
        error: (err) => this.ngZone.run(() => this.onSaveError(err))
      });
    } else {
      this.usersService.createUser(dataToSave).subscribe({
        next: () => this.ngZone.run(() => this.onSaveSuccess()),
        error: (err) => this.ngZone.run(() => this.onSaveError(err))
      });
    }
  }

  private onSaveSuccess() {
    Swal.fire('¡Éxito!', 'Usuario guardado correctamente', 'success').then(() => {
      this.closeModal();
      this.fetchUsers();
      this.isSubmitting = false;
      this.cdr.detectChanges();
    });
  }

  private onSaveError(err: any) {
    console.error('Error saving user', err);
    Swal.fire('Error', err.error?.message || 'Error al guardar el usuario', 'error');
    this.isSubmitting = false;
    this.cdr.detectChanges();
  }

  deleteUser(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto. Se eliminará el usuario y sus datos asociados.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usersService.deleteUser(id).subscribe({
          next: () => {
            this.ngZone.run(() => {
              Swal.fire('¡Eliminado!', 'El usuario ha sido eliminado.', 'success');
              this.fetchUsers();
            });
          },
          error: (err) => {
            this.ngZone.run(() => {
              console.error('Error deleting user', err);
              Swal.fire('Error', 'No se pudo eliminar el usuario', 'error');
            });
          }
        });
      }
    });
  }
}


