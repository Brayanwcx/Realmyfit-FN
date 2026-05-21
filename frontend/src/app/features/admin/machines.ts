import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MachinesService, Machine } from '../../core/services/machines.service';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-machines',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="view-header">
      <h2>Gestión de Máquinas</h2>
      <button class="btn-primary" (click)="openModal()">Añadir Máquina</button>
    </div>
    
    <div class="table-container glass">
      @if (loading) {
        <div class="loading-state">Cargando máquinas...</div>
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
              <th>Máquina</th>
              <th>Marca</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (machine of machines; track machine.id) {
              <tr>
                <td>
                  <div class="machine-name">{{ machine.name }}</div>
                </td>
                <td>
                  <div class="brand">{{ machine.brand || 'N/A' }}</div>
                </td>
                <td>
                  <span class="badge" 
                        [class.badge-available]="machine.status === 'AVAILABLE'" 
                        [class.badge-maintenance]="machine.status === 'IN_MAINTENANCE'"
                        [class.badge-outofservice]="machine.status === 'OUT_OF_SERVICE'">
                    {{ getStatusText(machine.status) }}
                  </span>
                </td>
                <td>
                  <button class="btn-icon" (click)="editMachine(machine)">Editar</button>
                  <button class="btn-icon delete" (click)="deleteMachine(machine.id!)">Eliminar</button>
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
                <span class="card-label">Máquina</span>
                <div class="card-value machine-name">{{ machine.name }}</div>
              </div>
              <div class="card-row">
                <span class="card-label">Marca</span>
                <div class="card-value">{{ machine.brand || 'N/A' }}</div>
              </div>
              <div class="card-row">
                <span class="card-label">Estado</span>
                <div class="card-value">
                  <span class="badge" 
                        [class.badge-available]="machine.status === 'AVAILABLE'" 
                        [class.badge-maintenance]="machine.status === 'IN_MAINTENANCE'"
                        [class.badge-outofservice]="machine.status === 'OUT_OF_SERVICE'">
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
          No se encontraron máquinas.
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
            <div class="form-group">
              <label>Nombre</label>
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
                <label>Fecha de Adquisición</label>
                <input type="date" name="acquisitionDate" [(ngModel)]="newMachine.acquisitionDate" class="glass-input">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Categoría</label>
                <input type="text" name="category" [(ngModel)]="newMachine.category" placeholder="Ej. FUERZA" class="glass-input">
              </div>
              <div class="form-group">
                <label>URL Video (YouTube)</label>
                <input type="url" name="videoUrl" [(ngModel)]="newMachine.videoUrl" placeholder="https://..." class="glass-input">
              </div>
            </div>

            <div class="form-group">
              <label>Carga Máxima</label>
              <input type="text" name="maxLoad" [(ngModel)]="newMachine.maxLoad" placeholder="Ej. 450 kg" class="glass-input">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Enfoque Muscular</label>
                <input type="text" name="muscleFocus" [(ngModel)]="newMachine.muscleFocus" placeholder="Ej. Tren Inferior Completo" class="glass-input">
              </div>
              <div class="form-group">
                <label>Nivel Recomendado</label>
                <input type="text" name="recommendedLevel" [(ngModel)]="newMachine.recommendedLevel" placeholder="Ej. Intermedio / Avanzado" class="glass-input">
              </div>
            </div>

            <div class="form-group">
              <label>URL de Imagen</label>
              <input type="url" name="imageUrl" [(ngModel)]="newMachine.imageUrl" placeholder="https://..." class="glass-input">
            </div>
  
            <div class="form-group">
              <label>Descripción</label>
              <textarea name="description" [(ngModel)]="newMachine.description" placeholder="Instrucciones o detalles de la máquina..." class="glass-input desc-input"></textarea>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="!machineForm.valid || isSubmitting">
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
    .table-container { padding: 1rem; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 1rem; color: rgba(255,255,255,0.6); font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.1); }
    td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .loading-state, .empty-state, .error-state { padding: 3rem; text-align: center; color: rgba(255,255,255,0.5); }
    .error-state { color: #ff4d4d; }
    .machine-name { font-weight: 600; color: #fff; }
    .machine-desc { font-size: 0.85rem; color: rgba(255,255,255,0.5); margin-top: 0.25rem; }
    .brand, .model { font-size: 0.9rem; }
    .brand { color: #fff; font-weight: 500; }
    .model { color: rgba(255,255,255,0.6); }
    
    .badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .badge-available { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
    .badge-maintenance { background: rgba(250, 204, 21, 0.2); color: #facc15; }
    .badge-outofservice { background: rgba(255, 77, 77, 0.2); color: #ff4d4d; }

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
      width: 100%; max-width: 600px; padding: 2rem; position: relative;
      max-height: 90vh; overflow-y: auto; box-sizing: border-box;
    }

    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; h3 { margin: 0; font-size: 1.5rem; } }
    .btn-close { background: none; border: none; color: #fff; font-size: 1.5rem; cursor: pointer; }

    /* Form Styles */
    .machine-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; label { font-size: 0.85rem; color: rgba(255,255,255,0.6); } }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .glass-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.75rem; color: #fff; font-family: inherit; outline: none; transition: 0.3s; box-sizing: border-box; width: 100%; &:focus { border-color: var(--color-primary, #4ade80); background: rgba(255,255,255,0.08); } }
    textarea.glass-input { min-height: 80px; resize: vertical; }
    textarea.desc-input { min-height: 60px; }
    
    select.glass-input option { background: #1a1a2e; color: #fff; }

    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
    .btn-secondary { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; transition: 0.3s; &:hover { background: rgba(255,255,255,0.1); } }
    
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
export class AdminMachinesComponent implements OnInit {
  private machinesService = inject(MachinesService);
  private cdr = inject(ChangeDetectorRef);
  
  machines: Machine[] = [];
  loading = true;
  errorMessage = '';
  
  showModal = false;
  isSubmitting = false;
  isEditing = false;
  editingId: number | null = null;
  
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
            this.errorMessage = 'Error de red (Status 0). Verifica que el backend esté encendido (npm run start:dev) y corriendo en el puerto 3005 sin problemas de CORS.';
          } else if (err.status === 401) {
            this.errorMessage = 'No autorizado (Status 401). Tu sesión expiró o el token es inválido.';
          } else if (err.status === 403) {
            this.errorMessage = 'Acceso denegado (Status 403). No tienes permisos de Administrador.';
          } else {
            this.errorMessage = `Error del servidor (Status ${err.status}): ${err.message || 'Desconocido'}`;
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
    this.isEditing = false;
    this.editingId = null;
    this.newMachine = this.getEmptyMachine();
  }

  editMachine(machine: Machine) {
    this.showModal = true;
    this.isEditing = true;
    this.editingId = machine.id!;
    this.newMachine = { ...machine };
  }

  closeModal() {
    this.showModal = false;
  }

  submitMachine() {
    this.isSubmitting = true;

    const payload = { ...this.newMachine };
    if (!payload.acquisitionDate) {
      delete payload.acquisitionDate;
    }

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
  }

  private onSaveSuccess() {
    this.isSubmitting = false;
    this.closeModal();
    this.fetchMachines();
    Swal.fire({
      icon: 'success',
      title: '¡Guardado!',
      text: 'La máquina ha sido guardada exitosamente',
      background: '#1a1a2e',
      color: '#fff',
      confirmButtonColor: '#4ade80'
    });
  }

  private onSaveError(err: any) {
    console.error('Error saving machine', err);
    this.isSubmitting = false;
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Hubo un problema al guardar la máquina',
      background: '#1a1a2e',
      color: '#fff',
      confirmButtonColor: '#4ade80'
    });
  }

  deleteMachine(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción.",
      icon: 'warning',
      showCancelButton: true,
      background: '#1a1a2e',
      color: '#fff',
      confirmButtonColor: '#ff4d4d',
      cancelButtonColor: 'rgba(255,255,255,0.1)',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.machinesService.deleteMachine(id).subscribe({
          next: () => {
            this.fetchMachines();
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'La máquina ha sido eliminada.',
              background: '#1a1a2e',
              color: '#fff',
              confirmButtonColor: '#4ade80'
            });
          },
          error: (err) => {
            console.error('Error deleting machine', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Hubo un problema al eliminar la máquina',
              background: '#1a1a2e',
              color: '#fff',
              confirmButtonColor: '#4ade80'
            });
          }
        });
      }
    });
  }
}
