import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrainersService } from '../../core/services/trainers.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-entrenadores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entrenadores.component.html',
  styleUrls: ['./entrenadores.component.scss'],
})
export class EntrenadoresComponent implements OnInit {
  private trainersService = inject(TrainersService);
  private apiBase = environment.apiUrl.replace('/api', '');

  entrenadores: any[] = [];
  loading = true;
  error = '';

  ngOnInit() {
    this.trainersService.getTrainersPublic().subscribe({
      next: (data) => {
        this.entrenadores = data.filter(t => t.isActive);
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la lista de entrenadores.';
        this.loading = false;
      }
    });
  }

  resolveImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${this.apiBase}${url}`;
  }

  getInitials(name: string, lastName: string): string {
    return `${(name || '?').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
  }
}
