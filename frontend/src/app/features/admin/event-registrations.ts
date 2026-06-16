import { Component, OnInit, inject, ChangeDetectorRef, NgZone, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventRegistrationsService } from '../../core/services/event-registrations.service';
import { finalize } from 'rxjs';
import Swal from '../../core/utils/app-swal';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-admin-event-registrations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-registrations.html',
  styleUrls: ['./event-registrations.scss']})
export class AdminEventRegistrationsComponent implements OnInit {
    destroyRef = inject(DestroyRef);
  private regService = inject(EventRegistrationsService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  
  registrations: any[] = [];
  loading = true;
  errorMessage = '';
  page = 1;
  pageSize = 10;

  get totalPages() { return Math.ceil(this.registrations.length / this.pageSize); }
  get pagedRegistrations() { return this.registrations.slice((this.page-1)*this.pageSize, this.page*this.pageSize); }
  get pageNumbers() { return Array.from({length: this.totalPages}, (_, i) => i + 1); }
  min(a: number, b: number) { return Math.min(a, b); }

  ngOnInit() {
    this.fetchRegistrations();
  }

  fetchRegistrations() {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.regService.findAll()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.registrations = data;
          this.page = 1;
        },
        error: (err) => {
          console.error('Error fetching event registrations:', err);
          this.errorMessage = 'No se pudieron cargar las inscripciones.';
        }
      });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'Confirmado';
      case 'PENDING': return 'Pendiente';
      case 'CANCELLED': return 'Cancelado';
      default: return status || '—';
    }
  }

  confirmRegistration(reg: any) {
    Swal.fire({
              title: '¿Confirmar inscripción?',
              html: `Confirmar asistencia de <b>${reg.user?.name || 'usuario'}</b> al evento <b>${reg.event?.title || ''}</b>`,
              icon: 'question',
              showCancelButton: true,
              confirmButtonColor: '#22c55e',
              cancelButtonColor: '#ef4444',
              confirmButtonText: 'Sí, confirmar',
              cancelButtonText: 'Cancelar'
            }).then((result) => {
              if (result.isConfirmed) {
                this.regService.update(reg.id, { status: 'CONFIRMED' }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                  next: () => {
                    this.fetchRegistrations();
                    Swal.fire('¡Confirmado!', 'La inscripción ha sido confirmada.', 'success');
                  },
                  error: () => {
                    Swal.fire('Error', 'No se pudo confirmar la inscripción.', 'error');
                  }
                });
              }
            });
  }

  deleteRegistration(id: number) {
    Swal.fire({
              title: '¿Eliminar inscripción?',
              text: 'No podrás revertir esta acción.',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#22c55e',
              cancelButtonColor: '#ef4444',
              confirmButtonText: 'Sí, eliminar',
              cancelButtonText: 'Cancelar'
            }).then((result) => {
              if (result.isConfirmed) {
                this.regService.remove(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                  next: () => {
                    this.fetchRegistrations();
                    Swal.fire('¡Eliminado!', 'La inscripción ha sido eliminada.', 'success');
                  },
                  error: () => {
                    Swal.fire('Error', 'No se pudo eliminar la inscripción.', 'error');
                  }
                });
              }
            });
  }
}
