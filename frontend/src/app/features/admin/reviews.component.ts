import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewsService } from '../../core/services/reviews.service';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="view-header">
      <h2>Gestión de Reseñas</h2>
    </div>
    <div class="table-container glass">
      <div *ngIf="loading" class="loading-state">Cargando reseñas...</div>
      <table *ngIf="!loading && reviews.length > 0">
        <thead>
          <tr><th>Usuario</th><th>Puntuación</th><th>Comentario</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of reviews">
            <td>{{ r.user?.name || 'Usuario' }}</td>
            <td>{{ r.rating }}/5</td>
            <td>{{ r.comment }}</td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="!loading && reviews.length === 0" class="empty-state">No hay reseñas.</div>
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
export class AdminReviewsComponent implements OnInit {
  private service = inject(ReviewsService);
  reviews: any[] = [];
  loading = true;

  ngOnInit() {
    this.service.getReviews().subscribe({
      next: (data) => { this.reviews = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
