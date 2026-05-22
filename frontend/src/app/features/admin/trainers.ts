import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrainersService } from '../../core/services/trainers.service';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-admin-trainers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="view-header">
      <h2>Gestión de Entrenadores</h2>
      <button class="btn-primary" (click)="openCreate()">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Nuevo Entrenador
      </button>
    </div>

    <div class="table-container glass">
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando entrenadores...</p>
      </div>

      <div *ngIf="errorMessage" class="error-state">
        <p>Error: {{ errorMessage }}</p>
        <button class="btn-primary" (click)="fetchTrainers()">Reintentar</button>
      </div>

      <table class="desktop-table" *ngIf="!loading && !errorMessage && trainers.length > 0">
        <thead>
          <tr>
            <th width="80px">Foto</th>
            <th>Entrenador</th>
            <th>Contacto</th>
            <th>Especialidad</th>
            <th width="100px">Estado</th>
            <th width="180px">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let trainer of trainers">
            <td>
              <div class="product-thumb glass">
                <img *ngIf="trainer.imageUrl" [src]="resolveImageUrl(trainer.imageUrl)" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" (error)="$any($event.target).src='https://placehold.co/80x80/1a1a2e/555?text=?' " />
                <div *ngIf="!trainer.imageUrl" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:linear-gradient(135deg, #0ea5e9, #7c3aed);color:white;font-weight:bold;border-radius:inherit;">
                  {{ (trainer.name || '?').charAt(0).toUpperCase() }}
                </div>
              </div>
            </td>
            <td>
               <div class="product-name">{{ trainer.name }} {{ trainer.lastName }}</div>
               <div class="product-desc">{{ trainer.experience ? trainer.experience + ' de Exp.' : '-' }}</div>
            </td>
            <td>
               <div class="product-name" style="font-size:0.9rem;">{{ trainer.phone || 'N/A' }}</div>
               <div class="product-desc">{{ trainer.email }}</div>
            </td>
            <td><span class="badge category-badge">{{ trainer.specialty || 'Sin definir' }}</span></td>
            <td>
               <span class="badge" [class.badge-active]="trainer.isActive" [class.badge-inactive]="!trainer.isActive">
                  {{ trainer.isActive ? 'Activo' : 'Inactivo' }}
               </span>
            </td>
            <td>
              <div class="actions-cell">
                <button class="btn-icon" (click)="openEdit(trainer)" title="Editar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  Editar
                </button>
                <button class="btn-icon delete" (click)="confirmDelete(trainer.id)" title="Eliminar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div *ngIf="!loading && !errorMessage && trainers.length === 0" class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        <p>No se encontraron entrenadores. Crea el primero.</p>
      </div>
    </div>

    <!-- ── Modal con Glassmorphism y 2 Columnas ── -->
    <div class="modal-overlay" *ngIf="showForm" (click)="cancelForm()">
      <div class="modal-content glass" (click)="$event.stopPropagation()">
        <div class="modal-header">
           <h3>{{ editMode ? 'Editar Entrenador' : 'Nuevo Entrenador' }}</h3>
           <button class="btn-close" (click)="cancelForm()">&times;</button>
        </div>

        <form (ngSubmit)="submitForm()" #trainerForm="ngForm" class="product-form">
           <div class="form-grid">
               <!-- Left Column -->
               <div class="form-column">
                  <div class="form-group">
                    <label>Nombre *</label>
                    <input type="text" name="name" [(ngModel)]="form.name" required placeholder="Ej. Carlos" class="glass-input">
                  </div>
                  <div class="form-group">
                    <label>Apellidos *</label>
                    <input type="text" name="lastName" [(ngModel)]="form.lastName" required placeholder="Ej. García López" class="glass-input">
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group">
                      <label>Especialidad</label>
                      <input type="text" name="specialty" [(ngModel)]="form.specialty" placeholder="Yoga, Crossfit..." class="glass-input">
                    </div>
                    <div class="form-group">
                      <label>Estado</label>
                      <div class="toggle-switch">
                        <input type="checkbox" id="isActive" name="isActive" [(ngModel)]="form.isActive">
                        <label for="isActive">Activo</label>
                      </div>
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Teléfono</label>
                      <input type="text" name="phone" [(ngModel)]="form.phone" placeholder="+57 300 000 0000" class="glass-input">
                    </div>
                    <div class="form-group">
                      <label>Experiencia</label>
                      <input type="text" name="experience" [(ngModel)]="form.experience" placeholder="5 años" class="glass-input">
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Correo Electrónico *</label>
                    <input type="email" name="email" [(ngModel)]="form.email" required placeholder="correo@ejemplo.com" class="glass-input">
                  </div>
               </div>

               <!-- Right Column -->
               <div class="form-column">
                  <div class="form-group" style="flex:1;">
                    <label>Foto de Perfil</label>
                    <div class="image-upload-area glass-input" [class.has-image]="imagePreview">
                      <img *ngIf="imagePreview" [src]="imagePreview" class="image-preview" alt="Preview">
                      <button *ngIf="imagePreview" type="button" class="btn-remove-image" (click)="removeImage()" title="Remover">&times;</button>
                      
                      <input *ngIf="!imagePreview" #fileInput type="file" (change)="onFileSelected($event)" accept="image/*" class="file-input" id="fileInput">
                      <label *ngIf="!imagePreview" for="fileInput" class="upload-prompt">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="mb-2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        <span>Haz clic para subir foto</span>
                        <small>PNG, JPG o WEBP (Max. 5MB)</small>
                      </label>
                      <p *ngIf="uploadError" style="position:absolute;bottom:10px;color:#ff4d4d;font-size:12px;">{{ uploadError }}</p>
                    </div>
                  </div>
               </div>
           </div>

           <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="cancelForm()">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="!trainerForm.valid || submitting">
                 <span *ngIf="submitting" class="spinner-small"></span> 
                 {{ submitting ? 'Guardando...' : (editMode ? 'Guardar Cambios' : 'Crear Entrenador') }}
              </button>
           </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .view-header h2 { font-size: 1.8rem; margin: 0; font-weight: 700; background: linear-gradient(to right, #fff, rgba(255,255,255,0.7)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    
    .btn-primary { display: inline-flex; align-items: center; justify-content: center; background: var(--color-primary, #0ea5e9); color: #000; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3); }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(14, 165, 233, 0.4); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
    
    .table-container { padding: 1.5rem; overflow-x: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
    .desktop-table { width: 100%; min-width: 800px; border-collapse: separate; border-spacing: 0; text-align: left; }
    .desktop-table th { padding: 1rem; color: rgba(255,255,255,0.6); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .desktop-table td { padding: 1.2rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; color: #fff; }

    .loading-state, .empty-state, .error-state { padding: 4rem 2rem; text-align: center; color: rgba(255,255,255,0.5); display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .empty-state svg { color: rgba(255,255,255,0.2); }
    .error-state { color: #ff4d4d; }
    
    .product-thumb { width: 48px; height: 48px; border-radius: 50%; background-size: cover; background-position: center; border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; }
    .product-name { font-weight: 600; font-size: 1.05rem; color: #fff; margin-bottom: 0.25rem; }
    .product-desc { font-size: 0.85rem; color: rgba(255,255,255,0.5); line-height: 1.4; }
    
    .badge { padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.5px; display: inline-block; }
    .category-badge { background: rgba(255,255,255,0.1); color: #fff; }
    .badge-active { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
    .badge-inactive { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    
    .actions-cell { display: flex; gap: 0.5rem; }
    .btn-icon { display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.5rem 0.8rem; border-radius: 8px; cursor: pointer; transition: 0.3s; font-size: 0.8rem; font-weight: 500; }
    .btn-icon:hover { background: rgba(255,255,255,0.1); }
    .btn-icon.delete:hover { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #f87171; }

    /* ── Form Modal Styles (Glassmorphism & 2-Col Grid) ── */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 1rem; }
    .modal-content { width: 100%; max-width: 900px; padding: 2.5rem; position: relative; max-height: 95vh; overflow-y: auto; box-sizing: border-box; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1rem; }
    .modal-header h3 { margin: 0; font-size: 1.5rem; font-weight: 700; color: #fff; }
    .btn-close { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 1.2rem; cursor: pointer; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
    .btn-close:hover { background: rgba(255,77,77,0.15); border-color: rgba(255,77,77,0.4); color: #ff8080; }

    .product-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 2rem; }
    .form-column { display: flex; flex-direction: column; gap: 1.1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.6rem; }
    .form-group label { font-size: 0.9rem; font-weight: 500; color: rgba(255,255,255,0.8); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    
    .glass-input { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.85rem 1rem; color: #fff; font-family: inherit; font-size: 0.95rem; outline: none; transition: 0.3s; box-sizing: border-box; width: 100%; }
    .glass-input:focus { border-color: var(--color-primary, #0ea5e9); background: rgba(255,255,255,0.06); box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1); }
    
    .toggle-switch { display: flex; align-items: center; gap: 0.75rem; height: 100%; padding: 0.5rem 0; }
    .toggle-switch input[type="checkbox"] { width: 44px; height: 24px; appearance: none; background: rgba(255,255,255,0.1); border-radius: 12px; position: relative; cursor: pointer; outline: none; transition: 0.3s; }
    .toggle-switch input[type="checkbox"]::after { content: ''; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: 0.3s; }
    .toggle-switch input[type="checkbox"]:checked { background: var(--color-primary, #0ea5e9); }
    .toggle-switch input[type="checkbox"]:checked::after { transform: translateX(20px); }
    .toggle-switch label { font-size: 0.9rem; color: rgba(255,255,255,0.8); cursor: pointer; }

    .image-upload-area { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 250px; position: relative; overflow: hidden; padding: 0; border: 2px dashed rgba(255,255,255,0.15); border-radius: 16px; background: rgba(255,255,255,0.02); transition: 0.3s; }
    .image-upload-area:hover { border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.05); }
    .image-upload-area.has-image { border-style: solid; border-color: rgba(255,255,255,0.1); }
    .file-input { position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 2; }
    .upload-prompt { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: rgba(255,255,255,0.5); pointer-events: none; }
    .upload-prompt span { font-weight: 500; color: rgba(255,255,255,0.8); }
    .upload-prompt small { font-size: 0.75rem; }
    
    .image-preview { width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; z-index: 1; }
    .btn-remove-image { position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.2); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 3; font-size: 1.2rem; transition: 0.2s; }
    .btn-remove-image:hover { background: rgba(239, 68, 68, 0.8); transform: scale(1.1); }
    
    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); }
    .btn-secondary { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 500; transition: 0.3s; }
    .btn-secondary:hover { background: rgba(255,255,255,0.1); }
    
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--color-primary, #0ea5e9); border-radius: 50%; animation: spin 1s linear infinite; }
    .spinner-small { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 0.5rem; vertical-align: middle; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AdminTrainersComponent implements OnInit {
  private trainersService = inject(TrainersService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private apiBase = environment.apiUrl; // e.g. http://localhost:3005

  trainers: any[] = [];
  loading = true;
  errorMessage = '';
  showForm = false;
  editMode = false;
  submitting = false;
  selectedTrainerId: number | null = null;

  // Image state
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadError = '';

  form = {
    name: '',
    lastName: '',
    email: '',
    phone: '',
    specialty: '',
    experience: '',
    imageUrl: '',
    isActive: true
  };

  ngOnInit() {
    this.fetchTrainers();
  }

  fetchTrainers() {
    this.loading = true;
    this.errorMessage = '';
    this.trainersService.getTrainers().subscribe({
      next: data => {
        this.trainers = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.errorMessage = err.error?.message || 'No se pudo cargar la lista de entrenadores.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  resolveImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${this.apiBase}${url}`;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.uploadError = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.uploadError = 'La imagen no puede superar 5 MB.';
      this.cdr.detectChanges();
      return;
    }
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
    this.form.imageUrl = '';
    const input = document.getElementById('fileInput') as HTMLInputElement;
    if (input) input.value = '';
    this.cdr.detectChanges();
  }

  openCreate() {
    this.editMode = false;
    this.selectedTrainerId = null;
    this.resetForm();
    this.showForm = true;
    this.cdr.detectChanges();
  }

  openEdit(trainer: any) {
    this.editMode = true;
    this.selectedTrainerId = trainer.id;
    this.selectedFile = null;
    this.imagePreview = trainer.imageUrl ? this.resolveImageUrl(trainer.imageUrl) : null;
    this.uploadError = '';
    this.form = {
      name: trainer.name || '',
      lastName: trainer.lastName || '',
      email: trainer.email || '',
      phone: trainer.phone || '',
      specialty: trainer.specialty || '',
      experience: trainer.experience || '',
      imageUrl: trainer.imageUrl || '',
      isActive: trainer.isActive ?? true
    };
    this.showForm = true;
    this.cdr.detectChanges();
  }

  submitForm() {
    this.submitting = true;
    this.cdr.detectChanges();

    const saveData = (imageUrl?: string) => {
      const payload = { ...this.form, ...(imageUrl ? { imageUrl } : {}) };
      const obs = this.editMode && this.selectedTrainerId !== null
        ? this.trainersService.updateTrainer(this.selectedTrainerId, payload)
        : this.trainersService.createTrainer(payload);

      obs.subscribe({
        next: () => {
          Swal.fire('¡Éxito!', 'Entrenador guardado correctamente', 'success').then(() => {
            this.ngZone.run(() => {
              this.submitting = false;
              this.cancelForm();
              this.fetchTrainers();
              this.cdr.detectChanges();
            });
          });
        },
        error: err => {
          this.submitting = false;
          this.errorMessage = err.error?.message || 'No se pudo guardar el entrenador.';
          Swal.fire('Error', this.errorMessage, 'error');
          this.cdr.detectChanges();
        }
      });
    };

    if (this.selectedFile) {
      this.trainersService.uploadImage(this.selectedFile).subscribe({
        next: ({ imageUrl }) => saveData(imageUrl),
        error: () => {
          this.submitting = false;
          this.uploadError = 'No se pudo subir la imagen. Intenta de nuevo.';
          this.cdr.detectChanges();
        }
      });
    } else {
      saveData();
    }
  }

  confirmDelete(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto. Se eliminará el entrenador permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.trainersService.deleteTrainer(id).subscribe({
          next: () => { 
            Swal.fire('¡Eliminado!', 'El entrenador ha sido eliminado.', 'success').then(() => {
              this.ngZone.run(() => {
                this.fetchTrainers(); 
              });
            });
          },
          error: () => {
            Swal.fire('Error', 'No se pudo eliminar el entrenador.', 'error');
            this.errorMessage = 'No se pudo eliminar el entrenador.';
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  cancelForm() {
    this.showForm = false;
    this.resetForm();
    this.cdr.detectChanges();
  }

  private resetForm() {
    this.form = { name: '', lastName: '', email: '', phone: '', specialty: '', experience: '', imageUrl: '', isActive: true };
    this.selectedFile = null;
    this.imagePreview = null;
    this.uploadError = '';
    this.submitting = false;
  }
}
