import { Component, OnInit, inject, ChangeDetectorRef, NgZone, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventsService } from '../../core/services/events.service';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs';
import Swal from '../../core/utils/app-swal';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './events.html',
  styleUrls: ['./events.scss']
})
export class AdminEventsComponent implements OnInit {
    destroyRef = inject(DestroyRef);
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
      }), takeUntilDestroyed(this.destroyRef))
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
        this.eventsService.uploadImage(this.selectedFile).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
        this.eventsService.updateEvent(this.editingEventId, dataToSave).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => this.onSaveSuccess(),
            error: (err) => this.onSaveError(err)
        });
    } else {
        this.eventsService.createEvent(dataToSave).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => this.onSaveSuccess(),
            error: (err) => this.onSaveError(err)
        });
    }
  }

  private onSaveSuccess() {
    this.isSubmitting = false;
      this.closeModal();
      this.fetchEvents();
      Swal.fire('¡Éxito!', 'Evento guardado correctamente', 'success');
  }

  private onSaveError(err: any) {
    console.error('Error saving event', err);
      this.isSubmitting = false;
      Swal.fire('Error', 'Error al guardar el evento', 'error');
      this.cdr.detectChanges();
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
        this.eventsService.deleteEvent(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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


