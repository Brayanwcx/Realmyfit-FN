import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EventsService } from '../../core/services/events.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './eventos.component.html',
  styleUrls: ['./eventos.component.scss'],
})
export class EventosComponent implements OnInit {
  private eventsService = inject(EventsService);
  private apiBase = environment.apiUrl;
  
  eventos: any[] = [];
  loading = true;

  ngOnInit() {
    this.eventsService.getEventsPublic().subscribe({
      next: (data) => {
        this.eventos = data.filter(e => e.isActive).map(e => ({
          ...e,
          instructor: 'Inst. Profesional',
          spots: e.capacity || 0,
          image: e.imageUrl ? this.resolveImageUrl(e.imageUrl) : 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
        }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  resolveImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${this.apiBase}${url}`;
  }
}
