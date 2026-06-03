import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventRegistrationsService } from '../../core/services/event-registrations.service';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-event-registrations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="view-header">
      <h2>Inscripciones a Eventos</h2>
      <p class="subtitle">Monitorea los usuarios inscritos y gestiona sus registros</p>
    </div>
    
    <div class="table-container glass">
      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando inscripciones...</p>
        </div>
      }

      @if (errorMessage) {
        <div class="error-state">
          <p>Error: {{ errorMessage }}</p>
          <button class="btn-primary" (click)="fetchRegistrations()">Reintentar</button>
        </div>
      }
      
      @if (!loading && !errorMessage && registrations.length > 0) {
        <!-- Desktop table -->
        <table class="desktop-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Evento</th>
              <th>Usuario</th>
              <th>Fecha de Registro</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (reg of pagedRegistrations; track reg.id) {
              <tr>
                <td class="id-col">#{{ reg.id }}</td>
                <td>
                  <div class="fw-bold">{{ reg.event?.title || 'Evento Desconocido' }}</div>
                  <div class="text-sm op-7">{{ reg.event?.date ? (reg.event.date | date:'mediumDate') : '' }}</div>
                </td>
                <td>
                  <div class="fw-bold">{{ reg.user?.name || '---' }} {{ reg.user?.lastName || '' }}</div>
                  <div class="text-sm op-7">{{ reg.user?.email || 'N/A' }}</div>
                </td>
                <td>{{ reg.registrationDate | date:'short' }}</td>
                <td>
                  <span class="status-badge"
                    [class.success]="reg.status === 'CONFIRMED'"
                    [class.warning]="reg.status === 'PENDING'"
                    [class.error]="reg.status === 'CANCELLED'">
                    {{ getStatusLabel(reg.status) }}
                  </span>
                </td>
                <td>
                  <div class="actions-cell">
                    @if (reg.status === 'PENDING') {
                      <button class="btn-icon confirm" (click)="confirmRegistration(reg)" title="Confirmar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Confirmar
                      </button>
                    }
                    <button class="btn-icon delete" (click)="deleteRegistration(reg.id)" title="Eliminar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>

        <!-- Mobile cards -->
        <div class="mobile-cards">
          @for (reg of pagedRegistrations; track reg.id) {
            <div class="mobile-card glass">
              <div class="card-row">
                <span class="card-label">Evento</span>
                <span class="card-value fw-bold">{{ reg.event?.title || '—' }}</span>
              </div>
              <div class="card-row">
                <span class="card-label">Usuario</span>
                <span class="card-value">{{ reg.user?.name || '—' }} {{ reg.user?.lastName || '' }}</span>
              </div>
              <div class="card-row">
                <span class="card-label">Email</span>
                <span class="card-value text-sm op-7">{{ reg.user?.email || 'N/A' }}</span>
              </div>
              <div class="card-row">
                <span class="card-label">Fecha</span>
                <span class="card-value">{{ reg.registrationDate | date:'short' }}</span>
              </div>
              <div class="card-row">
                <span class="card-label">Estado</span>
                <span class="status-badge"
                  [class.success]="reg.status === 'CONFIRMED'"
                  [class.warning]="reg.status === 'PENDING'"
                  [class.error]="reg.status === 'CANCELLED'">
                  {{ getStatusLabel(reg.status) }}
                </span>
              </div>
              <div class="card-actions">
                @if (reg.status === 'PENDING') {
                  <button class="btn-icon confirm" (click)="confirmRegistration(reg)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Confirmar
                  </button>
                }
                <button class="btn-icon delete" (click)="deleteRegistration(reg.id)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  Eliminar
                </button>
              </div>
            </div>
          }
        </div>

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
            <span class="page-info">{{ (page-1)*pageSize+1 }}–{{ min(page*pageSize, registrations.length) }} de {{ registrations.length }}</span>
          </div>
        }
      }

      @if (!loading && !errorMessage && registrations.length === 0) {
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <p>No hay inscripciones registradas.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .view-header { margin-bottom: 2rem; }
    .view-header h2 { margin: 0; font-size: 1.8rem; font-weight: 700; background: linear-gradient(to right, #fff, rgba(255,255,255,0.7)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .subtitle { color: rgba(255,255,255,0.6); margin: 0.25rem 0 0; font-size: 0.9rem; }
    
    .table-container { padding: 1.5rem; overflow-x: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
    .desktop-table { width: 100%; min-width: 700px; border-collapse: separate; border-spacing: 0; text-align: left; }
    .desktop-table th { padding: 1rem; color: rgba(255,255,255,0.6); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .desktop-table td { padding: 1.1rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; color: #fff; }
    .id-col { color: rgba(255,255,255,0.5); font-size: 0.85rem; }
    
    .loading-state, .empty-state, .error-state { padding: 3rem; text-align: center; color: rgba(255,255,255,0.55); display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .error-state { color: #ff6b6b; }
    .spinner { width: 36px; height: 36px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--color-primary, #0ea5e9); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .fw-bold { font-weight: 600; }
    .text-sm { font-size: 0.8rem; }
    .op-7 { opacity: 0.7; }
    
    .status-badge { font-size: 0.75rem; font-weight: 600; padding: 0.3rem 0.7rem; border-radius: 20px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); display: inline-block; letter-spacing: 0.4px; }
    .status-badge.success { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }
    .status-badge.warning { background: rgba(250,204,21,0.15); color: #fbbf24; border: 1px solid rgba(250,204,21,0.3); }
    .status-badge.error { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
    
    .actions-cell { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .btn-icon { display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.45rem 0.85rem; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 500; transition: 0.2s; }
    .btn-icon:hover { background: rgba(255,255,255,0.1); }
    .btn-icon.confirm { border-color: rgba(34,197,94,0.35); color: #4ade80; }
    .btn-icon.confirm:hover { background: rgba(34,197,94,0.1); }
    .btn-icon.delete { border-color: rgba(239,68,68,0.35); color: #f87171; }
    .btn-icon.delete:hover { background: rgba(239,68,68,0.1); }

    .btn-primary { display: inline-flex; align-items: center; justify-content: center; background: var(--color-primary, #0ea5e9); color: #000; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; }

    .pagination { display: flex; align-items: center; gap: 0.4rem; justify-content: center; padding: 1.5rem 0 0.5rem; flex-wrap: wrap; }
    .page-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: 0.2s; display: inline-flex; align-items: center; justify-content: center; }
    .page-btn:hover:not(:disabled) { background: rgba(255,255,255,0.12); }
    .page-btn.active { background: #0ea5e9; color: #000; font-weight: 700; border-color: transparent; }
    .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .page-info { font-size: 0.8rem; color: rgba(255,255,255,0.45); margin-left: 0.5rem; }

    .mobile-cards { display: none; }
    @media (max-width: 768px) {
      .desktop-table { display: none; }
      .mobile-cards { display: flex; flex-direction: column; gap: 1rem; }
      .mobile-card { padding: 1.25rem; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
      .card-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .card-label { font-size: 0.85rem; color: rgba(255,255,255,0.6); }
      .card-value { color: white; font-weight: 500; font-size: 0.9rem; }
      .card-actions { display: flex; gap: 0.5rem; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.05); }
      .card-actions .btn-icon { flex: 1; justify-content: center; text-align: center; }
    }
  `]
})
export class AdminEventRegistrationsComponent implements OnInit {
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
      }))
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
    this.ngZone.run(() => {
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
          this.regService.update(reg.id, { status: 'CONFIRMED' }).subscribe({
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
    });
  }

  deleteRegistration(id: number) {
    this.ngZone.run(() => {
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
          this.regService.remove(id).subscribe({
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
    });
  }
}
