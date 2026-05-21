import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
      <div>
        <h2>Entrenadores</h2>
        <p class="subtitle">Administra a tu equipo de entrenadores</p>
      </div>
      <button class="btn-primary" (click)="openCreate()">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:middle">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Nuevo entrenador
      </button>
    </div>

    <div class="table-container glass">
      <div *ngIf="loading" class="loading-state">Cargando entrenadores...</div>

      <div *ngIf="errorMessage" class="error-state">
        <p>Error: {{ errorMessage }}</p>
        <button class="btn-primary" (click)="fetchTrainers()">Reintentar</button>
      </div>

      <table *ngIf="!loading && !errorMessage && trainers.length > 0">
        <thead>
          <tr>
            <th>Foto</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Especialidad</th>
            <th>Teléfono</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let trainer of trainers">
            <td>
              <div class="table-avatar">
                <img *ngIf="trainer.imageUrl" [src]="resolveImageUrl(trainer.imageUrl)" [alt]="trainer.name" />
                <div *ngIf="!trainer.imageUrl" class="avatar-placeholder">
                  {{ (trainer.name || '?').charAt(0).toUpperCase() }}
                </div>
              </div>
            </td>
            <td>{{ trainer.name }} {{ trainer.lastName }}</td>
            <td>{{ trainer.email }}</td>
            <td>{{ trainer.specialty || 'Sin definir' }}</td>
            <td>{{ trainer.phone || 'N/A' }}</td>
            <td>
              <span class="badge" [class.active]="trainer.isActive">
                {{ trainer.isActive ? 'Sí' : 'No' }}
              </span>
            </td>
            <td>
              <button class="btn-icon" (click)="openEdit(trainer)">Editar</button>
              <button class="btn-icon delete" (click)="confirmDelete(trainer.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div *ngIf="!loading && trainers.length === 0" class="empty-state">
        No se encontraron entrenadores.
      </div>
    </div>

    <!-- ── Backdrop ── -->
    <div class="modal-backdrop" *ngIf="showForm" (click)="cancelForm()"></div>

    <!-- ── Modal ── -->
    <div class="modal" *ngIf="showForm" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>{{ editMode ? 'Editar entrenador' : 'Nuevo entrenador' }}</h3>
        <button class="modal-close" type="button" (click)="cancelForm()" aria-label="Cerrar modal">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <form (ngSubmit)="submitForm()">
        <!-- Image upload -->
        <div class="image-upload-zone" (click)="fileInput.click()">
          <img *ngIf="imagePreview" [src]="imagePreview" class="image-preview" alt="Preview" />
          <div *ngIf="!imagePreview" class="upload-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="1.5"
                 stroke-linecap="round" stroke-linejoin="round" style="opacity:0.5;margin-bottom:8px">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <p>Haz clic para subir una foto</p>
            <span>JPG, PNG, WebP · Máx 5 MB</span>
          </div>
          <div *ngIf="imagePreview" class="image-overlay">
            <span>Cambiar foto</span>
          </div>
        </div>
        <input #fileInput type="file" accept="image/jpeg,image/png,image/webp,image/gif"
               style="display:none" (change)="onFileSelected($event)" />
        <p *ngIf="uploadError" class="upload-error">{{ uploadError }}</p>

        <div class="form-grid">
          <label>
            Nombre
            <input type="text" [(ngModel)]="form.name" name="name" required placeholder="Ej: Carlos" />
          </label>
          <label>
            Apellidos
            <input type="text" [(ngModel)]="form.lastName" name="lastName" required placeholder="Ej: García López" />
          </label>
          <label>
            Email
            <input type="email" [(ngModel)]="form.email" name="email" required placeholder="correo@ejemplo.com" />
          </label>
          <label>
            Teléfono
            <input type="text" [(ngModel)]="form.phone" name="phone" placeholder="Ej: +57 300 000 0000" />
          </label>
          <label>
            Especialidad
            <input type="text" [(ngModel)]="form.specialty" name="specialty" placeholder="Ej: Yoga, Crossfit..." />
          </label>
          <label>
            Experiencia
            <input type="text" [(ngModel)]="form.experience" name="experience" placeholder="Ej: 5 años" />
          </label>
          <label class="checkbox-label full-width">
            <input type="checkbox" [(ngModel)]="form.isActive" name="isActive" />
            <span>Activo</span>
          </label>
        </div>

        <div class="form-actions">
          <button class="btn-secondary" type="button" (click)="cancelForm()">Cancelar</button>
          <button class="btn-primary" type="submit" [disabled]="submitting">
            <span *ngIf="submitting">Guardando...</span>
            <span *ngIf="!submitting">{{ editMode ? 'Guardar cambios' : 'Crear entrenador' }}</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    /* ── Layout ── */
    .view-header {
      display: flex; justify-content: space-between; align-items: center;
      gap: 1rem; margin-bottom: 2rem;
    }
    .view-header h2 { margin: 0; }
    .subtitle { color: rgba(255,255,255,0.6); margin: 0.25rem 0 0; font-size: 0.9rem; }

    /* ── Table ── */
    .table-container { padding: 1.25rem; overflow-x: auto; margin-bottom: 2rem; }
    table { width: 100%; border-collapse: collapse; color: #fff; }
    th, td { padding: 0.85rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.08); vertical-align: middle; }
    th { text-align: left; font-weight: 600; color: rgba(255,255,255,0.7); font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.04em; }
    tbody tr { transition: background 0.15s; }
    tbody tr:hover { background: rgba(255,255,255,0.04); }

    /* Avatar in table */
    .table-avatar { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; }
    .table-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .avatar-placeholder {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #0ea5e9, #7c3aed);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1rem; color: #fff;
    }

    .badge {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 0.3rem 0.7rem; border-radius: 999px; font-size: 0.78rem;
      background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6);
    }
    .badge.active { background: rgba(56,189,248,0.15); color: #7dd3fc; }

    .loading-state, .empty-state, .error-state {
      padding: 2.5rem; text-align: center; color: rgba(255,255,255,0.55);
    }
    .error-state { color: #ff6b6b; }

    /* ── Buttons ── */
    .btn-primary {
      display: inline-flex; align-items: center;
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      color: #fff; border: none; padding: 0.75rem 1.4rem;
      border-radius: 12px; cursor: pointer; font-weight: 600;
      font-size: 0.9rem; transition: opacity 0.2s, transform 0.15s;
    }
    .btn-primary:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary {
      background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.85);
      border: 1px solid rgba(255,255,255,0.12); padding: 0.75rem 1.25rem;
      border-radius: 12px; cursor: pointer; font-weight: 600;
      font-size: 0.9rem; transition: background 0.2s;
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.13); }
    .btn-icon {
      border: 1px solid rgba(255,255,255,0.12); background: transparent;
      color: #fff; padding: 0.45rem 0.8rem; border-radius: 8px;
      cursor: pointer; margin-right: 0.4rem; font-size: 0.8rem; transition: background 0.2s;
    }
    .btn-icon:hover { background: rgba(255,255,255,0.06); }
    .btn-icon.delete { border-color: rgba(255,77,77,0.35); color: #ff9090; }
    .btn-icon.delete:hover { background: rgba(255,77,77,0.1); }

    /* ── Modal Backdrop ── */
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px); z-index: 1000;
      animation: fadeIn 0.2s ease both;
    }

    /* ── Modal Box ── */
    .modal {
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -50%); z-index: 1001;
      width: min(700px, 94vw); max-height: 90vh; overflow-y: auto;
      background: rgba(14, 18, 30, 0.97);
      border: 1px solid rgba(255,255,255,0.09); border-radius: 24px;
      box-shadow: 0 40px 100px rgba(0,0,0,0.65), 0 0 0 1px rgba(14,165,233,0.07),
                  inset 0 1px 0 rgba(255,255,255,0.05);
      padding: 2rem 2rem 1.75rem;
      animation: slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp {
      from { opacity: 0; transform: translate(-50%, calc(-50% + 24px)); }
      to   { opacity: 1; transform: translate(-50%, -50%); }
    }

    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 1.5rem; padding-bottom: 1.25rem;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .modal-header h3 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
    .modal-close {
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09);
      color: rgba(255,255,255,0.6); border-radius: 10px; width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s; flex-shrink: 0;
    }
    .modal-close:hover { background: rgba(255,77,77,0.15); border-color: rgba(255,77,77,0.4); color: #ff8080; }

    /* ── Image Upload Zone ── */
    .image-upload-zone {
      position: relative; width: 100%; height: 180px;
      border: 2px dashed rgba(255,255,255,0.15); border-radius: 16px;
      cursor: pointer; overflow: hidden; margin-bottom: 1.25rem;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.03); transition: border-color 0.2s, background 0.2s;
    }
    .image-upload-zone:hover { border-color: rgba(14,165,233,0.5); background: rgba(14,165,233,0.04); }
    .upload-placeholder { text-align: center; color: rgba(255,255,255,0.5); }
    .upload-placeholder p { margin: 0 0 4px; font-size: 0.9rem; color: rgba(255,255,255,0.7); }
    .upload-placeholder span { font-size: 0.78rem; }
    .image-preview { width: 100%; height: 100%; object-fit: cover; }
    .image-overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.2s; color: #fff; font-weight: 600;
    }
    .image-upload-zone:hover .image-overlay { opacity: 1; }
    .upload-error { color: #ff6b6b; font-size: 0.82rem; margin: -0.75rem 0 1rem; }

    /* ── Form Grid ── */
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.1rem; }
    .full-width { grid-column: 1 / -1; }
    label { display: flex; flex-direction: column; gap: 0.45rem; font-size: 0.85rem; font-weight: 500; color: rgba(255,255,255,0.75); }
    input[type="text"], input[type="email"] {
      width: 100%; padding: 0.8rem 1rem; box-sizing: border-box;
      border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.04); color: #fff; font-size: 0.93rem;
      outline: none; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    }
    input[type="text"]::placeholder, input[type="email"]::placeholder { color: rgba(255,255,255,0.25); }
    input[type="text"]:focus, input[type="email"]:focus {
      border-color: rgba(14,165,233,0.55); box-shadow: 0 0 0 3px rgba(14,165,233,0.1);
      background: rgba(255,255,255,0.06);
    }
    .checkbox-label { flex-direction: row !important; align-items: center; gap: 0.75rem; cursor: pointer; padding: 0.5rem 0; }
    .checkbox-label input[type="checkbox"] { width: 18px; height: 18px; accent-color: #0ea5e9; cursor: pointer; }

    .form-actions {
      display: flex; gap: 0.75rem; margin-top: 1.75rem; justify-content: flex-end;
      padding-top: 1.25rem; border-top: 1px solid rgba(255,255,255,0.07);
    }
  `]
})
export class AdminTrainersComponent implements OnInit {
  private trainersService = inject(TrainersService);
  private cdr = inject(ChangeDetectorRef);
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
          this.submitting = false;
          this.cancelForm();
          this.fetchTrainers();
          Swal.fire({
            icon: 'success',
            title: '¡Guardado!',
            text: this.editMode ? 'Entrenador actualizado correctamente.' : 'Entrenador creado correctamente.',
            background: '#fff',
            color: '#1a1a2e',
            confirmButtonColor: '#0ea5e9',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: err => {
          this.submitting = false;
          const msg = err.error?.message || 'No se pudo guardar el entrenador.';
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: msg,
            background: '#fff',
            color: '#1a1a2e',
            confirmButtonColor: '#0ea5e9'
          });
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
      title: '¿Eliminar entrenador?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      background: '#fff',
      color: '#1a1a2e',
      confirmButtonColor: '#ff4d4d',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (!result.isConfirmed) return;
      this.trainersService.deleteTrainer(id).subscribe({
        next: () => {
          this.fetchTrainers();
          Swal.fire({ title: 'Eliminado', icon: 'success', background: '#fff', color: '#1a1a2e', confirmButtonColor: '#0ea5e9', timer: 1500, showConfirmButton: false });
        },
        error: () => {
          Swal.fire({ title: 'Error', text: 'No se pudo eliminar el entrenador.', icon: 'error', background: '#fff', color: '#1a1a2e', confirmButtonColor: '#0ea5e9' });
          this.cdr.detectChanges();
        }
      });
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
