import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MachinesService, Machine } from '../../core/services/machines.service';

@Component({
  selector: 'app-maquinas',
  imports: [RouterLink, CommonModule],
  templateUrl: './maquinas.component.html',
  styleUrls: ['./maquinas.component.scss'],
})
export class MaquinasComponent implements OnInit {
  private machinesService = inject(MachinesService);

  maquinas: Machine[] = [];
  loading = true;
  errorMessage = '';

  ngOnInit() {
    this.machinesService.getMachinesPublic().subscribe({
      next: (data) => {
        this.maquinas = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando máquinas:', err);
        this.errorMessage = 'No se pudo cargar el equipamiento. Intenta de nuevo más tarde.';
        this.loading = false;
      }
    });
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'Disponible';
      case 'IN_MAINTENANCE': return 'En Mantenimiento';
      case 'OUT_OF_SERVICE': return 'Fuera de Servicio';
      default: return status;
    }
  }
}
