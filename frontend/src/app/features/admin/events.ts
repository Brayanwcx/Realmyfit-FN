import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventsService } from '../../core/services/events.service';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="view-header">
      <h2>Gestión de Eventos</h2>
      <button class="btn-primary" (click)="openModal()">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Nuevo Evento
      </button>
    </div>
    
    <div class="table-container glass">
      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando eventos...</p>
        </div>
      }

      @if (errorMessage) {
        <div class="error-state">
          <p>Error: {{ errorMessage }}</p>
          <button class="btn-primary" (click)="fetchEvents()">Reintentar</button>
        </div>
      }
      
      @if (!loading && !errorMessage && events.length > 0) {
        <table class="desktop-table">
          <thead>
            <tr>
              <th width="80px">Banner</th>
              <th>Evento</th>
              <th width="150px">Fecha / Hora</th>
              <th>Ubicación</th>
              <th width="110px">Precio</th>
              <th width="100px">Estado</th>
              <th width="180px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (event of pagedEvents; track event.id) {
              <tr>
                <td>
                  <div class="event-thumb glass" [style.backgroundImage]="'url(' + getImageUrl(event.imageUrl) + ')'">
                    @if (!event.imageUrl) {
                      <div class="no-thumb">📅</div>
                    }
                  </div>
                </td>
                <td>
                  <div class="product-name">{{ event.title }}</div>
                  <div class="product-desc">{{ event.description | slice:0:50 }}{{ (event.description?.length ?? 0) > 50 ? '...' : '' }}</div>
                </td>
                <td>
                  <div class="product-name" style="font-size:0.9rem;">{{ event.date | date:'mediumDate' }}</div>
                  <div class="product-desc">{{ event.time }}</div>
                </td>
                <td>{{ event.location }}</td>
                <td>
                  @if (Number(event.price) > 0) {
                    <span class="price-tag">{{ formatPrice(event.price) }}</span>
                  } @else {
                    <span class="price-free">Gratis</span>
                  }
                </td>
                <td>
                  <span class="badge" [class.badge-active]="event.isActive" [class.badge-inactive]="!event.isActive">
                    {{ event.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="btn-icon" (click)="editEvent(event)" title="Editar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      Editar
                    </button>
                    <button class="btn-icon delete" (click)="deleteEvent(event.id)" title="Eliminar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
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
            <span class="page-info">{{ (page-1)*pageSize+1 }}–{{ min(page*pageSize, events.length) }} de {{ events.length }}</span>
          </div>
        }
      }

      @if (!loading && !errorMessage && events.length === 0) {
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <p>No se encontraron eventos. Crea el primero.</p>
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
            <div class="form-grid">
              <!-- Left Column -->
              <div class="form-column">
                <div class="form-group">
                  <label>Título del Evento *</label>
                  <input type="text" name="title" [(ngModel)]="newEvent.title" required placeholder="Ej. Masterclass de Yoga" class="glass-input">
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Fecha *</label>
                    <input type="date" name="date" [(ngModel)]="newEvent.date" [min]="minDate" required class="glass-input">
                  </div>
                  <div class="form-group">
                    <label>Hora *</label>
                    <input type="time" name="time" [(ngModel)]="newEvent.time" required class="glass-input">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Ubicación *</label>
                    <input type="text" name="location" [(ngModel)]="newEvent.location" required placeholder="Ej. Sala A" class="glass-input">
                  </div>
                  <div class="form-group">
                    <label>Capacidad *</label>
                    <input type="number" name="capacity" [(ngModel)]="newEvent.capacity" required placeholder="0" class="glass-input">
                  </div>
                </div>
                <div class="form-group">
                  <label>Precio (USD) *</label>
                  <input type="number" name="price" [(ngModel)]="newEvent.price" required min="0" step="0.01" placeholder="0.00" class="glass-input">
                  <small class="field-hint">Usa 0 para eventos gratuitos</small>
                </div>
                <div class="form-group" style="flex:1;">
                  <label>Descripción *</label>
                  <textarea name="description" [(ngModel)]="newEvent.description" required placeholder="Describe el evento..." class="glass-input desc-area"></textarea>
                </div>
              </div>

              <!-- Right Column -->
              <div class="form-column">
                <div class="form-group" style="flex:1;">
                  <label>Imagen del Evento</label>
                  <div class="image-upload-area" (click)="eventFileInput.click()">
                    @if (imagePreview) {
                      <button type="button" class="btn-remove-image" (click)="removeImage($event)" title="Quitar imagen">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                      <img [src]="imagePreview" class="image-preview" alt="Preview" style="max-height: 100%; object-fit: contain;">
                      <div class="image-overlay">Cambiar imagen</div>
                    } @else {
                      <div class="image-placeholder">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        <span>Haz clic para subir banner</span>
                        <small>JPG, PNG, WEBP o GIF · Máx. 5 MB</small>
                      </div>
                    }
                  </div>
                  <input #eventFileInput type="file" accept="image/jpg,image/jpeg,image/png,image/webp,image/gif"
                         style="display:none" (change)="onFileSelected($event)">
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="!eventForm.valid || isSubmitting">
                <span *ngIf="isSubmitting" class="spinner-small"></span>
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
    .view-header h2 { font-size: 1.8rem; margin: 0; font-weight: 700; background: linear-gradient(to right, #fff, rgba(255,255,255,0.7)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

    .btn-primary { display: inline-flex; align-items: center; justify-content: center; background: var(--color-primary, #0ea5e9); color: #000; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(14,165,233,0.3); }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(14,165,233,0.4); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

    .table-container { padding: 1.5rem; overflow-x: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
    .desktop-table { width: 100%; min-width: 750px; border-collapse: separate; border-spacing: 0; text-align: left; }
    .desktop-table th { padding: 1rem; color: rgba(255,255,255,0.6); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .desktop-table td { padding: 1.2rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; color: #fff; }

    .loading-state, .empty-state, .error-state { padding: 4rem 2rem; text-align: center; color: rgba(255,255,255,0.5); display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .empty-state svg { color: rgba(255,255,255,0.2); }
    .error-state { color: #ff4d4d; }

    .event-thumb { width: 56px; height: 40px; border-radius: 10px; background-size: cover; background-position: center; border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .no-thumb { font-size: 1.2rem; opacity: 0.5; }
    .product-name { font-weight: 600; color: #fff; margin-bottom: 0.15rem; }
    .product-desc { font-size: 0.82rem; color: rgba(255,255,255,0.5); }

    .badge { padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.5px; display: inline-block; }
    .badge-active { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }
    .badge-inactive { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
    .price-tag { font-weight: 700; color: #4ade80; }
    .price-free { font-size: 0.85rem; color: rgba(255,255,255,0.5); font-style: italic; }
    .field-hint { font-size: 0.78rem; color: rgba(255,255,255,0.4); margin-top: 0.25rem; }

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
    .event-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 2rem; }
    .form-column { display: flex; flex-direction: column; gap: 1.1rem; }
    .desc-area { flex: 1; resize: vertical; min-height: 120px; }
    .form-group { display: flex; flex-direction: column; gap: 0.6rem; }
    .form-group label { font-size: 0.9rem; font-weight: 500; color: rgba(255,255,255,0.8); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .glass-input { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.85rem 1rem; color: #fff; font-family: inherit; font-size: 0.95rem; outline: none; transition: 0.3s; box-sizing: border-box; width: 100%; }
    .glass-input:focus { border-color: var(--color-primary, #0ea5e9); background: rgba(255,255,255,0.06); box-shadow: 0 0 0 4px rgba(14,165,233,0.1); }
    textarea.glass-input { resize: vertical; min-height: 80px; }

    .image-upload-area { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 160px; position: relative; overflow: hidden; padding: 0; border: 2px dashed rgba(255,255,255,0.15); border-radius: 16px; background: rgba(255,255,255,0.02); transition: 0.3s; cursor: pointer; }
    .image-upload-area:hover { border-color: var(--color-primary, #0ea5e9); background: rgba(255,255,255,0.05); }
    .image-placeholder { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: rgba(255,255,255,0.4); text-align: center; padding: 1rem; }
    .image-preview { width: 100%; height: 100%; object-fit: cover; }
    .image-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); color: white; padding: 0.5rem; text-align: center; font-size: 0.8rem; }
    .btn-remove-image { position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(239, 68, 68, 0.9); color: white; width: 28px; height: 28px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; transition: transform 0.2s, background 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
    .btn-remove-image:hover { background: #ef4444; transform: scale(1.1); }

    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); }
    .btn-secondary { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 500; transition: 0.3s; }
    .btn-secondary:hover { background: rgba(255,255,255,0.1); }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--color-primary, #0ea5e9); border-radius: 50%; animation: spin 1s linear infinite; }
    .spinner-small { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 0.5rem; vertical-align: middle; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .pagination { display: flex; align-items: center; gap: 0.4rem; justify-content: center; padding: 1.5rem 0 0.5rem; flex-wrap: wrap; }
    .page-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: 0.2s; display: inline-flex; align-items: center; justify-content: center; }
    .page-btn:hover:not(:disabled) { background: rgba(255,255,255,0.12); }
    .page-btn.active { background: var(--color-primary, #0ea5e9); color: #000; font-weight: 700; border-color: transparent; }
    .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .page-info { font-size: 0.8rem; color: rgba(255,255,255,0.45); margin-left: 0.5rem; }

    @media (max-width: 768px) {
      .view-header { flex-direction: column; align-items: stretch; gap: 1rem; }
      .view-header button { width: 100%; }
      .modal-content { padding: 1.5rem; }
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminEventsComponent implements OnInit {
  private eventsService = inject(EventsService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  
  events: any[] = [];
  loading = true;
  errorMessage = '';
  page = 1;
  pageSize = 10;

  get totalPages() { return Math.ceil(this.events.length / this.pageSize); }
  get pagedEvents() { return this.events.slice((this.page-1)*this.pageSize, this.page*this.pageSize); }
  get pageNumbers() { return Array.from({length: this.totalPages}, (_, i) => i + 1); }
  min(a: number, b: number) { return Math.min(a, b); }
  Number = Number;

  formatPrice(price: number | string): string {
    return '$ ' + new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(price));
  }
  
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
    price: 0,
    imageUrl: '',
    isActive: true
  };
  minDate: string = '';

  ngOnInit() {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
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
          this.page = 1;
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
    this.newEvent = { title: '', description: '', date: '', time: '', location: '', capacity: 0, price: 0, imageUrl: '', isActive: true };
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
        price: Number(event.price) || 0,
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
        this.cdr.detectChanges(); // Force update: FileReader runs outside Angular's zone
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(e?: Event) {
    if (e) e.stopPropagation();
    this.selectedFile = null;
    this.imagePreview = null;
    this.newEvent.imageUrl = '';
    const input = document.querySelector('.image-upload-area + input') as HTMLInputElement;
    if (input) input.value = '';
    this.cdr.detectChanges();
  }

  submitEvent() {
    this.isSubmitting = true;
    
    if (this.selectedFile) {
        this.eventsService.uploadImage(this.selectedFile).subscribe({
          next: (uploadRes) => {
            this.newEvent.imageUrl = uploadRes.imageUrl;
            this.saveEventData();
          },
          error: (err) => {
            console.error('Error uploading image', err);
            Swal.fire('Error', 'Error al subir la imagen', 'error');
            this.isSubmitting = false;
          }
        });
    } else {
        this.saveEventData();
    }
  }

  private saveEventData() {
    const dataToSave = { 
        ...this.newEvent, 
        price: Number(this.newEvent.price) || 0,
        capacity: Number(this.newEvent.capacity) || 0
    };

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
    this.ngZone.run(() => {
      this.isSubmitting = false;
      this.closeModal();
      this.fetchEvents();
      Swal.fire('¡Éxito!', 'Evento guardado correctamente', 'success');
    });
  }

  private onSaveError(err: any) {
    this.ngZone.run(() => {
      console.error('Error saving event', err);
      this.isSubmitting = false;
      Swal.fire('Error', 'Error al guardar el evento', 'error');
      this.cdr.detectChanges();
    });
  }

  deleteEvent(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto. Se eliminará el evento.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.eventsService.deleteEvent(id).subscribe({
          next: () => {
            Swal.fire('¡Eliminado!', 'El evento ha sido eliminado.', 'success');
            this.fetchEvents();
          },
          error: (err) => {
            console.error('Error deleting event', err);
            Swal.fire('Error', 'No se pudo eliminar el evento', 'error');
          }
        });
      }
    });
  }
}


