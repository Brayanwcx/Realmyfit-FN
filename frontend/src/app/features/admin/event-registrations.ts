import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventRegistrationsService } from '../../core/services/event-registrations.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admin-event-registrations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="view-header">
      <h2>Inscripciones a Eventos</h2>
      <p class="subtitle">Monitorea los usuarios inscritos</p>
    </div>
    
    <div class="table-container glass">
      @if (loading) {
        <div class="loading-state">Cargando inscripciones...</div>
      }

      @if (errorMessage) {
        <div class="error-state">
          <p>Error: {{ errorMessage }}</p>
          <button class="btn-primary" (click)="fetchRegistrations()">Reintentar</button>
        </div>
      }
      
      @if (!loading && !errorMessage && registrations.length > 0) {
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Evento</th>
              <th>Usuario</th>
              <th>Fecha Registro</th>
              <th>Estado de Pago</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (reg of registrations; track reg.id) {
              <tr>
                <td>#{{ reg.id }}</td>
                <td>
                  <div class="fw-bold">{{ reg.event?.title || 'Evento Desconocido' }}</div>
                </td>
                <td>
                  <div class="fw-bold">{{ reg.user?.name || '---' }} {{ reg.user?.lastName || '' }}</div>
                  <div class="text-sm op-7">{{ reg.user?.email || 'N/A' }}</div>
                </td>
                <td>{{ reg.registrationDate | date:'short' }}</td>
                <td>
                  <span class="status-badge" [class.success]="reg.paymentStatus === 'PAID'" [class.warning]="reg.paymentStatus === 'PENDING'" [class.error]="reg.paymentStatus === 'FAILED'">
                    {{ reg.paymentStatus }}
                  </span>
                </td>
                <td>
                  <button class="btn-icon delete" (click)="deleteRegistration(reg.id)">Eliminar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      @if (!loading && !errorMessage && registrations.length === 0) {
        <div class="empty-state">
          No hay inscripciones registradas.
        </div>
      }
    </div>
  `,
  styles: [`
    .view-header { margin-bottom: 2rem; }
    .view-header h2 { margin: 0; }
    .subtitle { color: rgba(255,255,255,0.6); margin: 0.25rem 0 0; font-size: 0.9rem; }
    
    .table-container { padding: 1.25rem; overflow-x: auto; margin-bottom: 2rem; }
    table { width: 100%; border-collapse: collapse; text-align: left; color: #fff; }
    th { padding: 0.85rem 1rem; color: rgba(255,255,255,0.7); font-weight: 600; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid rgba(255,255,255,0.08); }
    td { padding: 0.85rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; }
    
    .loading-state, .empty-state, .error-state { padding: 3rem; text-align: center; color: rgba(255,255,255,0.55); }
    .error-state { color: #ff6b6b; }
    
    .fw-bold { font-weight: 600; }
    .text-sm { font-size: 0.8rem; }
    .op-7 { opacity: 0.7; }
    
    .status-badge { font-size: 0.75rem; font-weight: 500; padding: 0.25rem 0.6rem; border-radius: 20px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
    .status-badge.success { background: rgba(39, 174, 96, 0.15); color: #4ade80; border: 1px solid rgba(39, 174, 96, 0.3); }
    .status-badge.warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .status-badge.error { background: rgba(255, 77, 77, 0.15); color: #ff6b6b; border: 1px solid rgba(255, 77, 77, 0.3); }
    
    .btn-icon { background: none; border: 1px solid rgba(255,255,255,0.12); color: #fff; padding: 0.45rem 0.8rem; border-radius: 8px; cursor: pointer; margin-right: 0.4rem; transition: 0.2s; font-size: 0.8rem; }
    .btn-icon:hover { background: rgba(255,255,255,0.06); }
    .btn-icon.delete { border-color: rgba(255,77,77,0.35); color: #ff9090; }
    .btn-icon.delete:hover { background: rgba(255,77,77,0.1); }
  `]
})
export class AdminEventRegistrationsComponent implements OnInit {
  private regService = inject(EventRegistrationsService);
  private cdr = inject(ChangeDetectorRef);
  
  registrations: any[] = [];
  loading = true;
  errorMessage = '';

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
        },
        error: (err) => {
          console.error('Error fetching event registrations:', err);
          this.errorMessage = 'No se pudieron cargar las inscripciones.';
        }
      });
  }

  deleteRegistration(id: number) {
    if (confirm('¿Estás seguro de eliminar esta inscripción? El cupo del evento podría ser restaurado automáticamente.')) {
      this.regService.remove(id).subscribe({
        next: () => this.fetchRegistrations(),
        error: (err) => alert('No se pudo eliminar la inscripción.')
      });
    }
  }
}
