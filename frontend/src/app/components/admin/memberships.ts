import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MembershipsService, Membership } from '../../services/memberships.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admin-memberships',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="view-header">
      <h2>Gestión de Membresías</h2>
      <button class="btn-primary" (click)="openModal()">Añadir Membresía</button>
    </div>
    
    <div class="table-container glass">
      @if (loading) {
        <div class="loading-state">Cargando membresías...</div>
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
              <th>Plan</th>
              <th>Precio</th>
              <th>Duración</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (membership of memberships; track membership.id) {
              <tr>
                <td>
                  <div class="product-name">{{ membership.name }}</div>
                  <div class="product-desc">{{ membership.description | slice:0:40 }}...</div>
                </td>
                <td class="price-val">\${{ membership.price }}</td>
                <td>{{ membership.durationDays }} días</td>
                <td>
                  <span class="badge" [class.badge-active]="membership.isActive" [class.badge-inactive]="!membership.isActive">
                    {{ membership.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td>
                  <button class="btn-icon" (click)="editMembership(membership)">Editar</button>
                  <button class="btn-icon delete" (click)="deleteMembership(membership.id!)">Eliminar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>

        <!-- Vista Mobile (Cards Seguras) -->
        <div class="mobile-cards">
          @for (membership of memberships; track membership.id) {
            <div class="mobile-card glass">
              <div class="card-row">
                <span class="card-label">Plan</span>
                <div class="card-value product-name">{{ membership.name }}</div>
              </div>
              <div class="card-row">
                <span class="card-label">Precio</span>
                <div class="card-value price-val">\${{ membership.price }}</div>
              </div>
              <div class="card-row">
                <span class="card-label">Duración</span>
                <div class="card-value">{{ membership.durationDays }} días</div>
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
          No se encontraron membresías.
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
            <div class="form-group">
              <label>Nombre del Plan</label>
              <input type="text" name="name" [(ngModel)]="newMembership.name" required placeholder="Ej. Plan Pro" class="glass-input">
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Precio ($)</label>
                <input type="number" name="price" [(ngModel)]="newMembership.price" required placeholder="0.00" class="glass-input">
              </div>
              <div class="form-group">
                <label>Duración (Días)</label>
                <input type="number" name="durationDays" [(ngModel)]="newMembership.durationDays" required placeholder="30" class="glass-input">
              </div>
            </div>
  
            <div class="form-group">
              <label>Descripción General</label>
              <textarea name="description" [(ngModel)]="newMembership.description" required placeholder="Breve descripción..." class="glass-input desc-input"></textarea>
            </div>

            <div class="form-group">
              <label>Beneficios / Detalles</label>
              <textarea name="benefits" [(ngModel)]="newMembership.benefits" placeholder="Ej. Acceso 24/7, Clases gratis..." class="glass-input"></textarea>
            </div>

            <div class="form-options">
              <label class="checkbox-container">
                <input type="checkbox" name="isActive" [(ngModel)]="newMembership.isActive">
                Mantener plan activo y visible
              </label>
            </div>
  
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="!membershipForm.valid || isSubmitting">
                {{ isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Membresía') }}
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
    .product-name { font-weight: 600; color: #fff; }
    .product-desc { font-size: 0.85rem; color: rgba(255,255,255,0.5); margin-top: 0.25rem; }
    .price-val { font-weight: 700; color: var(--color-primary, #4ade80); }
    
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
      max-height: 90vh; overflow-y: auto; box-sizing: border-box;
    }

    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; h3 { margin: 0; font-size: 1.5rem; } }
    .btn-close { background: none; border: none; color: #fff; font-size: 1.5rem; cursor: pointer; }

    /* Form Styles */
    .product-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; label { font-size: 0.85rem; color: rgba(255,255,255,0.6); } }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .glass-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.75rem; color: #fff; font-family: inherit; outline: none; transition: 0.3s; box-sizing: border-box; width: 100%; &:focus { border-color: var(--color-primary, #4ade80); background: rgba(255,255,255,0.08); } }
    textarea.glass-input { min-height: 80px; resize: vertical; }
    textarea.desc-input { min-height: 60px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
    .btn-secondary { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; transition: 0.3s; &:hover { background: rgba(255,255,255,0.1); } }
    
    .checkbox-container { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.85rem; color: rgba(255,255,255,0.8); }

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
export class AdminMembershipsComponent implements OnInit {
  private membershipsService = inject(MembershipsService);
  private cdr = inject(ChangeDetectorRef);
  
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
          this.memberships = data;
        },
        error: (err) => {
          console.error('Error fetching memberships:', err);
          this.errorMessage = err.status === 401 ? 'No autorizado.' : 'Error de conexión con el servidor.';
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
            next: () => this.onSaveSuccess(),
            error: (err) => this.onSaveError(err)
        });
    } else {
        this.membershipsService.createMembership(dataToSave).subscribe({
            next: () => this.onSaveSuccess(),
            error: (err) => this.onSaveError(err)
        });
    }
  }

  private onSaveSuccess() {
    this.isSubmitting = false;
    this.closeModal();
    this.fetchMemberships();
  }

  private onSaveError(err: any) {
    console.error('Error saving membership', err);
    alert('Error al guardar la membresía');
    this.isSubmitting = false;
  }

  deleteMembership(id: number) {
    if (confirm('¿Estás seguro de eliminar este plan de membresía? No se puede deshacer.')) {
      this.membershipsService.deleteMembership(id).subscribe({
        next: () => this.fetchMemberships(),
        error: (err) => console.error('Error deleting membership', err)
      });
    }
  }
}
