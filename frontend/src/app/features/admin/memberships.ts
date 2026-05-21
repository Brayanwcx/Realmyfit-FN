import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MembershipsService, Membership } from '../../core/services/memberships.service';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-memberships',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="view-header">
      <h2>Gestión de Membresías</h2>
      <button class="btn-primary" (click)="openModal()">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Añadir Membresía
      </button>
    </div>
    
    <div class="table-container glass">
      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando membresías...</p>
        </div>
      }

      @if (errorMessage) {
        <div class="error-state">
          <p>Error: {{ errorMessage }}</p>
          <button class="btn-primary" (click)="fetchMemberships()">Reintentar</button>
        </div>
      }
      
      @if (!loading && !errorMessage && memberships.length > 0) {
        <!-- Vista Desktop -->
        <table class="desktop-table">
          <thead>
            <tr>
              <th>Información del Plan</th>
              <th width="120px">Precio</th>
              <th width="120px">Duración</th>
              <th width="100px">Estado</th>
              <th width="180px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (membership of memberships; track membership.id) {
              <tr>
                <td>
                  <div class="product-name">{{ membership.name }}</div>
                  <div class="product-desc" title="{{ membership.description }}">{{ membership.description | slice:0:40 }}{{ membership.description.length > 40 ? '...' : '' }}</div>
                </td>
                <td class="font-bold">\${{ membership.price }}</td>
                <td>
                  <span class="badge badge-good">{{ membership.durationDays }} días</span>
                </td>
                <td>
                  <span class="badge" [class.badge-active]="membership.isActive" [class.badge-inactive]="!membership.isActive">
                    {{ membership.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="btn-icon" (click)="editMembership(membership)" title="Editar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      Editar
                    </button>
                    <button class="btn-icon delete" (click)="deleteMembership(membership.id!)" title="Eliminar">
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
          @for (membership of memberships; track membership.id) {
            <div class="mobile-card glass">
              <div class="card-header">
                <div class="card-title" style="margin-left: 0;">
                  <h4>{{ membership.name }}</h4>
                </div>
              </div>
              <div class="card-row">
                <span class="card-label">Precio</span>
                <div class="card-value font-bold">\${{ membership.price }}</div>
              </div>
              <div class="card-row">
                <span class="card-label">Duración</span>
                <div class="card-value">
                  <span class="badge badge-good">{{ membership.durationDays }} días</span>
                </div>
              </div>
              <div class="card-row">
                <span class="card-label">Estado</span>
                <div class="card-value">
                  <span class="badge" [class.badge-active]="membership.isActive" [class.badge-inactive]="!membership.isActive">
                    {{ membership.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>
              </div>
              <div class="card-actions">
                <button class="btn-icon" (click)="editMembership(membership)">Editar</button>
                <button class="btn-icon delete" (click)="deleteMembership(membership.id!)">Eliminar</button>
              </div>
            </div>
          }
        </div>
      }

      @if (!loading && !errorMessage && memberships.length === 0) {
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          <p>No se encontraron membresías. Crea la primera.</p>
        </div>
      }
    </div>

    <!-- Modal Formulario -->
    @if (showModal) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-content glass" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Editar Membresía' : 'Nueva Membresía' }}</h3>
            <button class="btn-close" (click)="closeModal()">&times;</button>
          </div>
          
          <form (ngSubmit)="submitMembership()" #membershipForm="ngForm" class="product-form">
            <div class="form-grid">
              
              <!-- Left Column -->
              <div class="form-column">
                <div class="form-group">
                  <label>Nombre del Plan *</label>
                  <input type="text" name="name" [(ngModel)]="newMembership.name" required placeholder="Ej. Plan Pro" class="glass-input">
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label>Precio ($) *</label>
                    <input type="number" name="price" [(ngModel)]="newMembership.price" required min="0" step="0.01" placeholder="0.00" class="glass-input">
                  </div>
                  <div class="form-group">
                    <label>Duración (Días) *</label>
                    <input type="number" name="durationDays" [(ngModel)]="newMembership.durationDays" required min="1" placeholder="30" class="glass-input">
                  </div>
                </div>

                <div class="form-group">
                  <label>Estado</label>
                  <div class="toggle-switch">
                    <input type="checkbox" id="isActive" name="isActive" [(ngModel)]="newMembership.isActive">
                    <label for="isActive">Activo (Visible en tienda)</label>
                  </div>
                </div>
              </div>

              <!-- Right Column -->
              <div class="form-column">
                <div class="form-group">
                  <label>Descripción General *</label>
                  <textarea name="description" [(ngModel)]="newMembership.description" required placeholder="Breve descripción..." class="glass-input" rows="3"></textarea>
                </div>
                
                <div class="form-group">
                  <label>Beneficios / Detalles</label>
                  <textarea name="benefits" [(ngModel)]="newMembership.benefits" placeholder="Ej. Acceso 24/7, Clases gratis..." class="glass-input" rows="4"></textarea>
                </div>
              </div>
              
            </div>
  
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="!membershipForm.valid || isSubmitting">
                @if(isSubmitting) {
                  <span class="spinner-small"></span> Guardando...
                } @else {
                  {{ isEditing ? 'Guardar Cambios' : 'Crear Membresía' }}
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
export class AdminMembershipsComponent implements OnInit {
  private membershipsService = inject(MembershipsService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  
  memberships: Membership[] = [];
  loading = true;
  errorMessage = '';
  
  showModal = false;
  isSubmitting = false;
  isEditing = false;
  editingId: number | null = null;
  
  newMembership: Partial<Membership> = {
    name: '',
    description: '',
    price: 0,
    durationDays: 30,
    benefits: '',
    isActive: true
  };

  ngOnInit() {
    this.fetchMemberships();
  }

  fetchMemberships() {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.membershipsService.getMemberships()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.ngZone.run(() => {
            this.memberships = data;
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Error fetching memberships:', err);
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
    this.newMembership = { 
      name: '', description: '', price: 0, durationDays: 30, benefits: '', isActive: true 
    };
  }

  editMembership(membership: Membership) {
    this.showModal = true;
    this.isEditing = true;
    this.editingId = membership.id!;
    this.newMembership = { ...membership };
  }

  closeModal() {
    this.showModal = false;
  }

  submitMembership() {
    this.isSubmitting = true;
    
    // Casting and parsing values heavily to map
    const dataToSave: Partial<Membership> = {
        ...this.newMembership,
        price: Number(this.newMembership.price),
        durationDays: Number(this.newMembership.durationDays)
    };

    if (this.isEditing && this.editingId) {
        this.membershipsService.updateMembership(this.editingId, dataToSave).subscribe({
            next: () => this.ngZone.run(() => this.onSaveSuccess()),
            error: (err) => this.ngZone.run(() => this.onSaveError(err))
        });
    } else {
        this.membershipsService.createMembership(dataToSave).subscribe({
            next: () => this.ngZone.run(() => this.onSaveSuccess()),
            error: (err) => this.ngZone.run(() => this.onSaveError(err))
        });
    }
  }

  private onSaveSuccess() {
    Swal.fire('¡Éxito!', 'Membresía guardada correctamente', 'success').then(() => {
      this.closeModal();
      this.fetchMemberships();
      this.isSubmitting = false;
      this.cdr.detectChanges();
    });
  }

  private onSaveError(err: any) {
    console.error('Error saving membership', err);
    Swal.fire('Error', 'Error al guardar la membresía', 'error');
    this.isSubmitting = false;
    this.cdr.detectChanges();
  }

  deleteMembership(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto. Se eliminará la membresía.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.membershipsService.deleteMembership(id).subscribe({
          next: () => {
            this.ngZone.run(() => {
              Swal.fire('¡Eliminado!', 'La membresía ha sido eliminada.', 'success');
              this.fetchMemberships();
            });
          },
          error: (err) => {
            this.ngZone.run(() => {
              console.error('Error deleting membership', err);
              Swal.fire('Error', 'No se pudo eliminar la membresía', 'error');
            });
          }
        });
      }
    });
  }
}



