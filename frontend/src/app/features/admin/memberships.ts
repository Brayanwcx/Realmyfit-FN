import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MembershipsService, Membership } from '../../core/services/memberships.service';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-memberships',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './memberships.html',
  styleUrls: ['./memberships.scss']})
export class AdminMembershipsComponent implements OnInit {
  private membershipsService = inject(MembershipsService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  
  memberships: Membership[] = [];
  loading = true;
  errorMessage = '';
  page = 1;
  pageSize = 10;

  get totalPages() { return Math.ceil(this.memberships.length / this.pageSize); }
  get pagedMemberships() { return this.memberships.slice((this.page-1)*this.pageSize, this.page*this.pageSize); }
  get pageNumbers() { return Array.from({length: this.totalPages}, (_, i) => i + 1); }
  min(a: number, b: number) { return Math.min(a, b); }
  
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
          this.ngZone.run(() => {
            this.memberships = data;
            this.page = 1;
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Error fetching memberships:', err);
            this.errorMessage = err.status === 401 ? 'No autorizado.' : 'Error de conexión con el servidor.';
            this.cdr.detectChanges();
          });
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
            next: () => this.ngZone.run(() => this.onSaveSuccess()),
            error: (err) => this.ngZone.run(() => this.onSaveError(err))
        });
    } else {
        this.membershipsService.createMembership(dataToSave).subscribe({
            next: () => this.ngZone.run(() => this.onSaveSuccess()),
            error: (err) => this.ngZone.run(() => this.onSaveError(err))
        });
    }
  }

  private onSaveSuccess() {
    Swal.fire('¡Éxito!', 'Membresía guardada correctamente', 'success').then(() => {
      this.closeModal();
      this.fetchMemberships();
      this.isSubmitting = false;
      this.cdr.detectChanges();
    });
  }

  private onSaveError(err: any) {
    console.error('Error saving membership', err);
    Swal.fire('Error', 'Error al guardar la membresía', 'error');
    this.isSubmitting = false;
    this.cdr.detectChanges();
  }

  deleteMembership(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto. Se eliminará la membresía.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.membershipsService.deleteMembership(id).subscribe({
          next: () => {
            this.ngZone.run(() => {
              Swal.fire('¡Eliminado!', 'La membresía ha sido eliminada.', 'success');
              this.fetchMemberships();
            });
          },
          error: (err) => {
            this.ngZone.run(() => {
              console.error('Error deleting membership', err);
              Swal.fire('Error', 'No se pudo eliminar la membresía', 'error');
            });
          }
        });
      }
    });
  }
}



