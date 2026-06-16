import { Component, OnInit, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MachinesService, Machine } from '../../core/services/machines.service';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-maquinas',
  imports: [RouterLink, CommonModule],
  templateUrl: './maquinas.component.html',
  styleUrls: ['./maquinas.component.scss'],
})
export class MaquinasComponent implements OnInit {
    destroyRef = inject(DestroyRef);
  public machinesService = inject(MachinesService);
  private cdr = inject(ChangeDetectorRef);

  maquinas: Machine[] = [];
  loading = true;
  errorMessage = '';

  ngOnInit() {
    this.machinesService.getMachinesPublic().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.maquinas = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando máquinas:', err);
        this.errorMessage = 'No se pudo cargar el equipamiento. Intenta de nuevo más tarde.';
        this.loading = false;
        this.cdr.detectChanges();
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
