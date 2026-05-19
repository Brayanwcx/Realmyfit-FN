import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MachinesService } from '../../core/services/machines.service';

@Component({
  selector: 'app-admin-machines',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="view-header">
      <h2>Gestión de Máquinas</h2>
    </div>
    <div class="table-container glass">
      <div *ngIf="loading" class="loading-state">Cargando máquinas...</div>
      <table *ngIf="!loading && machines.length > 0">
        <thead>
          <tr><th>Nombre</th><th>Estado</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let m of machines">
            <td>{{ m.name }}</td>
            <td>{{ m.status }}</td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="!loading && machines.length === 0" class="empty-state">No hay máquinas.</div>
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
export class AdminMachinesComponent implements OnInit {
  private service = inject(MachinesService);
  machines: any[] = [];
  loading = true;

  ngOnInit() {
    this.service.getMachines().subscribe({
      next: (data) => { this.machines = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
