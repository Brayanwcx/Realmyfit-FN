import { Component, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
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
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  entrenadores: any[] = [];
  loading = true;
  error = '';

  ngOnInit() {
    this.trainersService.getTrainersPublic().subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.entrenadores = data.filter((t: any) => t.isActive);
          this.loading = false;
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.ngZone.run(() => {
          this.error = 'No se pudo cargar la lista de entrenadores.';
          this.loading = false;
        });
        this.cdr.detectChanges();
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
