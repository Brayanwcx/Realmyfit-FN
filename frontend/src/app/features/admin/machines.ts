import { Component, OnInit, inject, ChangeDetectorRef, NgZone, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MachinesService, Machine } from '../../core/services/machines.service';
import { finalize, switchMap, of } from 'rxjs';
import Swal from '../../core/utils/app-swal';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-admin-machines',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './machines.html',
  styleUrls: ['./machines.scss']})
export class AdminMachinesComponent implements OnInit {
    destroyRef = inject(DestroyRef);
  public machinesService = inject(MachinesService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  
  machines: Machine[] = [];
  loading = true;
  errorMessage = '';
  page = 1;
  pageSize = 10;

  get totalPages() { return Math.ceil(this.machines.length / this.pageSize); }
  get pagedMachines() { return this.machines.slice((this.page-1)*this.pageSize, this.page*this.pageSize); }
  get pageNumbers() { return Array.from({length: this.totalPages}, (_, i) => i + 1); }
  min(a: number, b: number) { return Math.min(a, b); }
  
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
      }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.machines = data;
          this.page = 1;
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

    uploadThenSave$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        const payload: any = { ...this.newMachine };
        Object.keys(payload).forEach(key => {
          if ((payload[key] === '' || payload[key] === null) && key !== 'imageUrl') {
            delete payload[key];
          }
        });

        if (this.isEditing && this.editingId) {
          this.machinesService.updateMachine(this.editingId, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => this.onSaveSuccess(),
            error: (err) => this.onSaveError(err)
          });
        } else {
          this.machinesService.createMachine(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => this.onSaveSuccess(),
            error: (err) => this.onSaveError(err)
          });
        }
      },
      error: (err) => this.onSaveError(err)
    });
  }

  private onSaveSuccess() {
    this.isSubmitting = false;
      this.closeModal();
      this.fetchMachines();
      Swal.fire('¡Éxito!', 'Máquina guardada correctamente', 'success');
  }

  private onSaveError(err: any) {
    console.error('Error saving machine', err);
      this.isSubmitting = false;
      Swal.fire('Error', 'Error al guardar la máquina', 'error');
      this.cdr.detectChanges();
  }

  deleteMachine(id: number) {
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
                this.machinesService.deleteMachine(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
  }
}
