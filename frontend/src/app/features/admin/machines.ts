import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MachinesService, Machine } from '../../core/services/machines.service';
import { finalize, switchMap, of } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-machines',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="view-header">
      <h2>Gestión de Máquinas</h2>
      <button class="btn-primary" (click)="openModal()">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Añadir Máquina
      </button>
    </div>
    
    <div class="table-container glass">
      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando máquinas...</p>
        </div>
      }

      @if (errorMessage) {
        <div class="error-state">
          <p>Error: {{ errorMessage }}</p>
          <button class="btn-primary" (click)="fetchMachines()">Reintentar</button>
        </div>
      }
      
      @if (!loading && !errorMessage && machines.length > 0) {
        <!-- Vista Desktop -->
        <table class="desktop-table">
          <thead>
            <tr>
              <th width="80px">Imagen</th>
              <th>Información de la Máquina</th>
              <th width="130px">Categoría</th>
              <th width="120px">Estado</th>
              <th width="180px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (machine of machines; track machine.id) {
              <tr>
                <td>
                  @if (machine.imageUrl) {
                    <img [src]="machinesService.getImageUrl(machine.imageUrl)" alt="Maquina" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);" (error)="machine.imageUrl = ''">
                  } @else {
                    <div style="width: 56px; height: 56px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.3);">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </div>
                  }
                </td>
                <td>
                  <div class="product-name">{{ machine.name }}</div>
                  <div class="product-desc">{{ machine.brand || 'N/A' }}</div>
                </td>
                <td><span class="badge category-badge">{{ machine.category || 'N/A' }}</span></td>
                <td>
                  <span class="badge" 
                        [class.badge-active]="machine.status === 'AVAILABLE'" 
                        [class.badge-warning]="machine.status === 'IN_MAINTENANCE'"
                        [class.badge-inactive]="machine.status === 'OUT_OF_SERVICE'">
                    {{ getStatusText(machine.status) }}
                  </span>
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="btn-icon" (click)="editMachine(machine)" title="Editar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      Editar
                    </button>
                    <button class="btn-icon delete" (click)="deleteMachine(machine.id!)" title="Eliminar">
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
          @for (machine of machines; track machine.id) {
            <div class="mobile-card glass">
              <div class="card-row">
                <span class="card-label">Imagen</span>
                <div class="card-value">
                  @if (machine.imageUrl) {
                    <img [src]="machinesService.getImageUrl(machine.imageUrl)" alt="Maquina" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;" (error)="machine.imageUrl = ''">
                  } @else {
                    -
                  }
                </div>
              </div>
              <div class="card-row">
                <span class="card-label">Máquina</span>
                <div class="card-value product-name">{{ machine.name }}</div>
              </div>
              <div class="card-row">
                <span class="card-label">Marca</span>
                <div class="card-value">{{ machine.brand || 'N/A' }}</div>
              </div>
              <div class="card-row">
                <span class="card-label">Categoría</span>
                <div class="card-value">{{ machine.category || 'N/A' }}</div>
              </div>
              <div class="card-row">
                <span class="card-label">Estado</span>
                <div class="card-value">
                  <span class="badge" 
                        [class.badge-active]="machine.status === 'AVAILABLE'" 
                        [class.badge-warning]="machine.status === 'IN_MAINTENANCE'"
                        [class.badge-inactive]="machine.status === 'OUT_OF_SERVICE'">
                    {{ getStatusText(machine.status) }}
                  </span>
                </div>
              </div>
              <div class="card-actions">
                <button class="btn-icon" (click)="editMachine(machine)">Editar</button>
                <button class="btn-icon delete" (click)="deleteMachine(machine.id!)">Eliminar</button>
              </div>
            </div>
          }
        </div>
      }

      @if (!loading && !errorMessage && machines.length === 0) {
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
          <p>No se encontraron máquinas. Crea la primera.</p>
        </div>
      }
    </div>

    <!-- Modal Formulario -->
    @if (showModal) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-content glass" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Editar Máquina' : 'Nueva Máquina' }}</h3>
            <button class="btn-close" (click)="closeModal()">&times;</button>
          </div>
          
          <form (ngSubmit)="submitMachine()" #machineForm="ngForm" class="machine-form">
            <div class="form-grid">
              <!-- Left Column -->
              <div class="form-column">
                <div class="form-group">
                  <label>Nombre *</label>
                  <input type="text" name="name" [(ngModel)]="newMachine.name" required placeholder="Ej. Prensa de Piernas" class="glass-input">
                </div>
                <div class="form-group">
                  <label>Marca</label>
                  <input type="text" name="brand" [(ngModel)]="newMachine.brand" placeholder="Ej. Technogym" class="glass-input">
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Estado</label>
                    <select name="status" [(ngModel)]="newMachine.status" required class="glass-input">
                      <option value="AVAILABLE">Disponible</option>
                      <option value="IN_MAINTENANCE">En Mantenimiento</option>
                      <option value="OUT_OF_SERVICE">Fuera de Servicio</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Categoría</label>
                    <input type="text" name="category" [(ngModel)]="newMachine.category" placeholder="Ej. FUERZA" class="glass-input">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Carga Máxima</label>
                    <input type="text" name="maxLoad" [(ngModel)]="newMachine.maxLoad" placeholder="Ej. 450 kg" class="glass-input">
                  </div>
                  <div class="form-group">
                    <label>Fecha de Adquisición</label>
                    <input type="date" name="acquisitionDate" [(ngModel)]="newMachine.acquisitionDate" class="glass-input">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Enfoque Muscular</label>
                    <input type="text" name="muscleFocus" [(ngModel)]="newMachine.muscleFocus" placeholder="Ej. Tren Inferior" class="glass-input">
                  </div>
                  <div class="form-group">
                    <label>Nivel Recomendado</label>
                    <input type="text" name="recommendedLevel" [(ngModel)]="newMachine.recommendedLevel" placeholder="Ej. Intermedio" class="glass-input">
                  </div>
                </div>
              </div>

              <!-- Right Column -->
              <div class="form-column">
                <div class="form-group">
                  <label>Imagen de la Máquina</label>
                  <div class="image-upload-area" (click)="imageFileInput.click()">
                    @if (imagePreview) {
                      <button type="button" class="btn-remove-image" (click)="removeImage($event)" title="Quitar imagen">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                      <img [src]="imagePreview" class="image-preview" alt="Preview" style="max-height: 100%; object-fit: contain;">
                      <div class="image-overlay">Cambiar imagen</div>
                    } @else {
                      <div class="image-placeholder">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        <span>Haz clic para subir una imagen</span>
                        <small>JPG, PNG, WEBP o GIF · Máx. 5 MB</small>
                      </div>
                    }
                  </div>
                  <input #imageFileInput type="file" accept="image/jpg,image/jpeg,image/png,image/webp,image/gif"
                         style="display:none" (change)="onImageSelected($event)">
                </div>
                <div class="form-group">
                  <label>URL Video (YouTube)</label>
                  <input type="url" name="videoUrl" [(ngModel)]="newMachine.videoUrl" placeholder="https://..." class="glass-input">
                </div>
                <div class="form-group" style="flex: 1;">
                  <label>Descripción</label>
                  <textarea name="description" [(ngModel)]="newMachine.description" placeholder="Instrucciones o detalles de la máquina..." class="glass-input desc-area"></textarea>
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="!machineForm.valid || isSubmitting">
                <span *ngIf="isSubmitting" class="spinner-small"></span>
                {{ isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Máquina') }}
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

    .btn-primary { display: inline-flex; align-items: center; justify-content: center; background: var(--color-primary, #0ea5e9); color: #000; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(14,165,233,0.3); }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(14,165,233,0.4); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

    .table-container { padding: 1.5rem; overflow-x: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
    .desktop-table { width: 100%; min-width: 600px; border-collapse: separate; border-spacing: 0; text-align: left; }
    .desktop-table th { padding: 1rem; color: rgba(255,255,255,0.6); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .desktop-table td { padding: 1.2rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; color: #fff; }

    .loading-state, .empty-state, .error-state { padding: 4rem 2rem; text-align: center; color: rgba(255,255,255,0.5); display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .empty-state svg { color: rgba(255,255,255,0.2); }
    .error-state { color: #ff4d4d; }

    .product-name { font-weight: 600; font-size: 1rem; color: #fff; }
    .product-desc { font-size: 0.9rem; color: rgba(255,255,255,0.6); }

    .badge { padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.5px; display: inline-block; }
    .category-badge { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); }
    .badge-active { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }
    .badge-warning { background: rgba(250,204,21,0.15); color: #fbbf24; border: 1px solid rgba(250,204,21,0.3); }
    .badge-inactive { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }

    .actions-cell { display: flex; gap: 0.5rem; }
    .btn-icon { display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.5rem 0.8rem; border-radius: 8px; cursor: pointer; transition: 0.3s; font-size: 0.8rem; font-weight: 500; }
    .btn-icon:hover { background: rgba(255,255,255,0.1); }
    .btn-icon.delete:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #f87171; }

    /* Modal */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 1rem; }
    .modal-content { width: 100%; max-width: 900px; padding: 2.5rem; position: relative; max-height: 95vh; overflow-y: auto; box-sizing: border-box; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1rem; }
    .modal-header h3 { margin: 0; font-size: 1.5rem; font-weight: 700; color: #fff; }
    .btn-close { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 1.2rem; cursor: pointer; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
    .btn-close:hover { background: rgba(255,77,77,0.15); border-color: rgba(255,77,77,0.4); color: #ff8080; }

    /* Form */
    .machine-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 2rem; }
    .form-column { display: flex; flex-direction: column; gap: 1.1rem; }
    .desc-area { flex: 1; resize: vertical; min-height: 140px; }
    .form-group { display: flex; flex-direction: column; gap: 0.6rem; }
    .form-group label { font-size: 0.9rem; font-weight: 500; color: rgba(255,255,255,0.8); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .glass-input { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.85rem 1rem; color: #fff; font-family: inherit; font-size: 0.95rem; outline: none; transition: 0.3s; box-sizing: border-box; width: 100%; }
    .glass-input:focus { border-color: var(--color-primary, #0ea5e9); background: rgba(255,255,255,0.06); box-shadow: 0 0 0 4px rgba(14,165,233,0.1); }
    textarea.glass-input { resize: vertical; min-height: 80px; }
    select.glass-input option { background: #1a1a2e; color: #fff; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); }
    .btn-secondary { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 500; transition: 0.3s; }
    .btn-secondary:hover { background: rgba(255,255,255,0.1); }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--color-primary, #0ea5e9); border-radius: 50%; animation: spin 1s linear infinite; }
    .spinner-small { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 0.5rem; vertical-align: middle; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .image-upload-area { height: 180px; border: 2px dashed rgba(255,255,255,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; overflow: hidden; background: rgba(255,255,255,0.02); transition: 0.3s; }
    .image-upload-area:hover { border-color: var(--color-primary, #0ea5e9); background: rgba(255,255,255,0.05); }
    .image-placeholder { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: rgba(255,255,255,0.4); text-align: center; padding: 1rem; }
    .image-preview { width: 100%; height: 100%; object-fit: cover; }
    .image-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); color: white; padding: 0.5rem; text-align: center; font-size: 0.8rem; }
    .btn-remove-image { position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(239, 68, 68, 0.9); color: white; width: 28px; height: 28px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; transition: transform 0.2s, background 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
    .btn-remove-image:hover { background: #ef4444; transform: scale(1.1); }

    .mobile-cards { display: none; }
    @media (max-width: 768px) {
      .view-header { flex-direction: column; align-items: stretch; gap: 1rem; }
      .view-header button { width: 100%; }
      .modal-content { padding: 1.5rem; }
      .form-row { grid-template-columns: 1fr; }
      .desktop-table { display: none; }
      .mobile-cards { display: flex; flex-direction: column; gap: 1rem; }
      .mobile-card { padding: 1.25rem; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
      .card-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .card-label { font-size: 0.85rem; color: rgba(255,255,255,0.6); }
      .card-value { color: white; font-weight: 500; }
      .card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); }
      .card-actions .btn-icon { justify-content: center; margin: 0; padding: 0.75rem; }
      .form-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminMachinesComponent implements OnInit {
  public machinesService = inject(MachinesService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  
  machines: Machine[] = [];
  loading = true;
  errorMessage = '';
  
  showModal = false;
  isSubmitting = false;
  isEditing = false;
  editingId: number | null = null;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  newMachine: Partial<Machine> = this.getEmptyMachine();

  ngOnInit() {
    this.fetchMachines();
  }

  getEmptyMachine(): Partial<Machine> {
    return {
      name: '',
      description: '',
      brand: '',
      status: 'AVAILABLE',
      imageUrl: '',
      acquisitionDate: '',
      category: '',
      videoUrl: '',
      maxLoad: '',
      muscleFocus: '',
      recommendedLevel: ''
    };
  }

  fetchMachines() {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.machinesService.getMachines()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.machines = data;
        },
        error: (err) => {
          console.error('Error fetching machines:', err);
          if (err.status === 0) {
            this.errorMessage = 'Error de red. Verifica que el backend esté activo.';
          } else if (err.status === 401) {
            this.errorMessage = 'No autorizado. Tu sesión expiró.';
          } else if (err.status === 403) {
            this.errorMessage = 'Acceso denegado. No tienes permisos de Administrador.';
          } else {
            this.errorMessage = `Error del servidor (${err.status}): ${err.message || 'Desconocido'}`;
          }
        }
      });
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'Disponible';
      case 'IN_MAINTENANCE': return 'Mantenimiento';
      case 'OUT_OF_SERVICE': return 'Fuera de Servicio';
      default: return status;
    }
  }

  openModal() {
    this.showModal = true;
    this.isSubmitting = false;
    this.isEditing = false;
    this.editingId = null;
    this.newMachine = this.getEmptyMachine();
    this.selectedFile = null;
    this.imagePreview = null;
  }

  editMachine(machine: Machine) {
    this.showModal = true;
    this.isEditing = true;
    this.editingId = machine.id!;
    this.newMachine = { ...machine };
    this.selectedFile = null;
    this.imagePreview = machine.imageUrl
      ? this.machinesService.getImageUrl(machine.imageUrl)
      : null;
  }

  closeModal() {
    this.showModal = false;
    this.selectedFile = null;
    this.imagePreview = null;
  }

  removeImage(e?: Event) {
    if (e) e.stopPropagation();
    this.selectedFile = null;
    this.imagePreview = null;
    this.newMachine.imageUrl = '';
    const input = document.querySelector('.image-upload-area + input') as HTMLInputElement;
    if (input) input.value = '';
    this.cdr.detectChanges();
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.selectedFile = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(this.selectedFile);
  }

  submitMachine() {
    this.isSubmitting = true;

    const uploadThenSave$ = this.selectedFile
      ? this.machinesService.uploadImage(this.selectedFile).pipe(
          switchMap((res: any) => {
            this.newMachine.imageUrl = res.imageUrl;
            return of(null);
          })
        )
      : of(null);

    uploadThenSave$.subscribe({
      next: () => {
        const payload: any = { ...this.newMachine };
        Object.keys(payload).forEach(key => {
          if ((payload[key] === '' || payload[key] === null) && key !== 'imageUrl') {
            delete payload[key];
          }
        });

        if (this.isEditing && this.editingId) {
          this.machinesService.updateMachine(this.editingId, payload).subscribe({
            next: () => this.onSaveSuccess(),
            error: (err) => this.onSaveError(err)
          });
        } else {
          this.machinesService.createMachine(payload).subscribe({
            next: () => this.onSaveSuccess(),
            error: (err) => this.onSaveError(err)
          });
        }
      },
      error: (err) => this.onSaveError(err)
    });
  }

  private onSaveSuccess() {
    this.ngZone.run(() => {
      this.isSubmitting = false;
      this.closeModal();
      this.fetchMachines();
      Swal.fire('¡Éxito!', 'Máquina guardada correctamente', 'success');
    });
  }

  private onSaveError(err: any) {
    this.ngZone.run(() => {
      console.error('Error saving machine', err);
      this.isSubmitting = false;
      Swal.fire('Error', 'Error al guardar la máquina', 'error');
      this.cdr.detectChanges();
    });
  }

  deleteMachine(id: number) {
    this.ngZone.run(() => {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'No podrás revertir esto. Se eliminará la máquina permanentemente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#22c55e',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.machinesService.deleteMachine(id).subscribe({
            next: () => {
              this.fetchMachines();
              Swal.fire('¡Eliminado!', 'La máquina ha sido eliminada.', 'success');
            },
            error: (err: any) => {
              console.error('Error deleting machine', err);
              Swal.fire('Error', 'No se pudo eliminar la máquina.', 'error');
            }
          });
        }
      });
    });
  }
}
