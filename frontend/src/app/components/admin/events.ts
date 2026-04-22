import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventsService } from '../../services/events.service';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="view-header">
      <h2>Gestión de Eventos</h2>
      <button class="btn-primary" (click)="openModal()">Nuevo Evento</button>
    </div>
    
    <div class="table-container glass">
      @if (loading) {
        <div class="loading-state">Cargando eventos...</div>
      }

      @if (errorMessage) {
        <div class="error-state">
          <p>Error: {{ errorMessage }}</p>
          <button class="btn-primary" (click)="fetchEvents()">Reintentar</button>
        </div>
      }
      
      @if (!loading && !errorMessage && events.length > 0) {
        <table>
          <thead>
            <tr>
              <th>Banner</th>
              <th>Evento</th>
              <th>Fecha / Hora</th>
              <th>Ubicación</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (event of events; track event.id) {
              <tr>
                <td>
                  <div class="event-thumb glass" [style.backgroundImage]="'url(' + getImageUrl(event.imageUrl) + ')'">
                    @if (!event.imageUrl) {
                      <div class="no-thumb">📅</div>
                    }
                  </div>
                </td>
                <td>
                  <div class="event-title">{{ event.title }}</div>
                  <div class="event-desc">{{ event.description | slice:0:30 }}...</div>
                </td>
                <td>
                  <div class="event-date">{{ event.date | date:'mediumDate' }}</div>
                  <div class="event-time">{{ event.time }}</div>
                </td>
                <td>{{ event.location }}</td>
                <td>
                  <span class="status-badge" [class.active]="event.isActive">
                    {{ event.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td>
                  <button class="btn-icon" (click)="editEvent(event)">Editar</button>
                  <button class="btn-icon delete" (click)="deleteEvent(event.id)">Eliminar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      @if (!loading && !errorMessage && events.length === 0) {
        <div class="empty-state">
          No se encontraron eventos.
        </div>
      }
    </div>

    <!-- Event Modal -->
    @if (showModal) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-content glass" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Editar Evento' : 'Nuevo Evento' }}</h3>
            <button class="btn-close" (click)="closeModal()">&times;</button>
          </div>
          
          <form (ngSubmit)="submitEvent()" #eventForm="ngForm" class="event-form">
            <div class="form-group">
              <label>Título del Evento</label>
              <input type="text" name="title" [(ngModel)]="newEvent.title" required placeholder="Ej. Masterclass de Yoga" class="glass-input">
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Fecha</label>
                <input type="date" name="date" [(ngModel)]="newEvent.date" required class="glass-input">
              </div>
              <div class="form-group">
                <label>Hora</label>
                <input type="time" name="time" [(ngModel)]="newEvent.time" required class="glass-input">
              </div>
            </div>
  
            <div class="form-row">
              <div class="form-group">
                <label>Ubicación</label>
                <input type="text" name="location" [(ngModel)]="newEvent.location" required placeholder="Ej. Sala A" class="glass-input">
              </div>
              <div class="form-group">
                <label>Capacidad</label>
                <input type="number" name="capacity" [(ngModel)]="newEvent.capacity" required placeholder="0" class="glass-input">
              </div>
            </div>
  
            <div class="form-group">
              <label>Imagen del Evento</label>
              <div class="file-upload-wrapper glass-input">
                <input type="file" (change)="onFileSelected($event)" accept="image/*" class="file-input" id="eventFileInput">
                <label for="eventFileInput" class="file-label">
                  @if (!selectedFile) {
                    <span>📁 Seleccionar banner...</span>
                  } @else {
                    <span>📄 {{ selectedFile.name }}</span>
                  }
                </label>
              </div>
              @if (imagePreview) {
                <div class="image-preview-container mt-2">
                  <img [src]="imagePreview" class="image-preview glass">
                  <button type="button" class="btn-remove-image" (click)="removeImage()">&times;</button>
                </div>
              }
            </div>
  
            <div class="form-group">
              <label>Descripción</label>
              <textarea name="description" [(ngModel)]="newEvent.description" required placeholder="Describe el evento..." class="glass-input"></textarea>
            </div>
  
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="!eventForm.valid || isSubmitting">
                {{ isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Evento') }}
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
    
    .event-thumb { width: 60px; height: 40px; border-radius: 8px; background-size: cover; background-position: center; border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .no-thumb { font-size: 1.2rem; filter: grayscale(1); opacity: 0.5; }
    
    .event-title { font-weight: 600; }
    .event-desc { font-size: 0.75rem; color: rgba(255,255,255,0.5); }
    .event-date { font-weight: 500; }
    .event-time { font-size: 0.8rem; color: rgba(255,255,255,0.5); }
    
    .status-badge { font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 20px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.5); }
    .status-badge.active { background: rgba(39, 174, 96, 0.1); color: #27ae60; border: 1px solid rgba(39, 174, 96, 0.2); }
    
    .btn-icon { background: none; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.4rem 0.8rem; border-radius: 8px; cursor: pointer; margin-right: 0.5rem; transition: 0.3s; font-size: 0.75rem; }
    .btn-icon:hover { background: rgba(255,255,255,0.05); }
    .btn-icon.delete:hover { border-color: #ff4d4d; color: #ff4d4d; }

    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 1rem; }
    .modal-content { width: 100%; max-width: 500px; padding: 2rem; position: relative; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; h3 { margin: 0; font-size: 1.5rem; } }
    .btn-close { background: none; border: none; color: #fff; font-size: 1.5rem; cursor: pointer; }
    .event-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; label { font-size: 0.85rem; color: rgba(255,255,255,0.6); } }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .glass-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.75rem; color: #fff; font-family: inherit; outline: none; transition: 0.3s; &:focus { border-color: var(--color-primary, #27ae60); background: rgba(255,255,255,0.08); } }
    textarea.glass-input { min-height: 80px; resize: vertical; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
    .btn-secondary { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; transition: 0.3s; &:hover { background: rgba(255,255,255,0.1); } }
    .file-upload-wrapper { position: relative; padding: 0; overflow: hidden; cursor: pointer; }
    .file-input { position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 2; }
    .file-label { display: block; padding: 0.75rem; font-size: 0.85rem; color: rgba(255,255,255,0.6); cursor: pointer; }
    .image-preview-container { position: relative; width: 100%; max-height: 150px; border-radius: 8px; overflow: hidden; }
    .image-preview { width: 100%; height: auto; max-height: 150px; object-fit: cover; display: block; }
    .btn-remove-image { position: absolute; top: 5px; right: 5px; background: rgba(255, 77, 77, 0.8); border: none; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 3; }
    .mt-2 { margin-top: 0.5rem; }
  `]
})
export class AdminEventsComponent implements OnInit {
  private eventsService = inject(EventsService);
  private cdr = inject(ChangeDetectorRef);
  
  events: any[] = [];
  loading = true;
  errorMessage = '';
  
  showModal = false;
  isSubmitting = false;
  isEditing = false;
  editingEventId: number | null = null;
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  
  newEvent = {
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    capacity: 0,
    imageUrl: '',
    isActive: true
  };

  ngOnInit() {
    this.fetchEvents();
  }

  getImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl}${url}`;
  }

  fetchEvents() {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.eventsService.getEvents()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.events = data;
          console.log('Eventos cargados:', this.events);
        },
        error: (err) => {
          console.error('Error fetching events:', err);
          this.errorMessage = 'Error al cargar los eventos.';
        }
      });
  }

  openModal() {
    this.showModal = true;
    this.isEditing = false;
    this.editingEventId = null;
    this.newEvent = { title: '', description: '', date: '', time: '', location: '', capacity: 0, imageUrl: '', isActive: true };
    this.selectedFile = null;
    this.imagePreview = null;
  }

  editEvent(event: any) {
    this.showModal = true;
    this.isEditing = true;
    this.editingEventId = event.id;
    this.newEvent = { 
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        capacity: event.capacity,
        imageUrl: event.imageUrl,
        isActive: event.isActive
    };
    this.imagePreview = this.getImageUrl(event.imageUrl);
    this.selectedFile = null;
  }

  closeModal() {
    this.showModal = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
    const input = document.getElementById('eventFileInput') as HTMLInputElement;
    if(input) input.value = '';
  }

  submitEvent() {
    this.isSubmitting = true;
    
    if (this.selectedFile) {
        this.eventsService.uploadImage(this.selectedFile).subscribe({
          next: (uploadRes) => {
            this.newEvent.imageUrl = uploadRes.url;
            this.saveEventData();
          },
          error: (err) => {
            console.error('Error uploading image', err);
            alert('Error al subir la imagen');
            this.isSubmitting = false;
          }
        });
    } else {
        this.saveEventData();
    }
  }

  private saveEventData() {
    const dataToSave = { ...this.newEvent };

    if (this.isEditing && this.editingEventId) {
        this.eventsService.updateEvent(this.editingEventId, dataToSave).subscribe({
            next: () => this.onSaveSuccess(),
            error: (err) => this.onSaveError(err)
        });
    } else {
        this.eventsService.createEvent(dataToSave).subscribe({
            next: () => this.onSaveSuccess(),
            error: (err) => this.onSaveError(err)
        });
    }
  }

  private onSaveSuccess() {
    this.isSubmitting = false;
    this.closeModal();
    this.fetchEvents();
  }

  private onSaveError(err: any) {
    console.error('Error saving event', err);
    alert('Error al guardar el evento');
    this.isSubmitting = false;
  }

  deleteEvent(id: number) {
    if (confirm('¿Estás seguro de eliminar este evento?')) {
      this.eventsService.deleteEvent(id).subscribe({
        next: () => this.fetchEvents(),
        error: (err) => console.error('Error deleting event', err)
      });
    }
  }
}
