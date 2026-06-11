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
  templateUrl: './trainers.html',
  styleUrls: ['./trainers.scss']})
export class AdminTrainersComponent implements OnInit {
  private trainersService = inject(TrainersService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private apiBase = environment.apiUrl; // e.g. http://localhost:3005

  trainers: any[] = [];
  loading = true;
  errorMessage = '';
  page = 1;
  pageSize = 10;

  get totalPages() { return Math.ceil(this.trainers.length / this.pageSize); }
  get pagedTrainers() { return this.trainers.slice((this.page-1)*this.pageSize, this.page*this.pageSize); }
  get pageNumbers() { return Array.from({length: this.totalPages}, (_, i) => i + 1); }
  min(a: number, b: number) { return Math.min(a, b); }

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
        this.page = 1;
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
