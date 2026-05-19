import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrainersService } from '../../core/services/trainers.service';

@Component({
  selector: 'app-admin-trainers',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="view-header">
      <h2>Gestión de Entrenadores</h2>
    </div>
    <div class="table-container glass">
      <div *ngIf="loading" class="loading-state">Cargando entrenadores...</div>
      <table *ngIf="!loading && trainers.length > 0">
        <thead>
          <tr><th>Nombre</th><th>Especialidad</th><th>Experiencia</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of trainers">
            <td>{{ t.name }}</td>
            <td>{{ t.specialty }}</td>
            <td>{{ t.experienceYears }} años</td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="!loading && trainers.length === 0" class="empty-state">No hay entrenadores.</div>
    </div>
  `,
  styles: [`
    .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .table-container { padding: 1rem; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 1rem; color: rgba(255,255,255,0.6); font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.1); }
    td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .loading-state, .empty-state { padding: 3rem; text-align: center; color: rgba(255,255,255,0.5); }
  `]
})
export class AdminTrainersComponent implements OnInit {
  private service = inject(TrainersService);
  trainers: any[] = [];
  loading = true;

  ngOnInit() {
    this.service.getTrainers().subscribe({
      next: (data) => { this.trainers = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
