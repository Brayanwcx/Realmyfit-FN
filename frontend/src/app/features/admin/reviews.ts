import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewsService, Review } from '../../core/services/reviews.service';

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
      
      <div *ngIf="errorMessage" class="error-state">
        <p>Error: {{ errorMessage }}</p>
        <button class="btn-primary" (click)="fetchReviews()">Reintentar</button>
      </div>

      <table *ngIf="!loading && !errorMessage && reviews.length > 0">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Puntaje</th>
            <th>Comentario</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let review of reviews">
            <td>{{ review.user?.name || 'Anónimo' }} {{ review.user?.lastName || '' }}</td>
            <td>
              <div class="stars">
                <span *ngFor="let star of [1,2,3,4,5]" class="star" [class.filled]="star <= review.rating">★</span>
              </div>
            </td>
            <td class="comment-cell" [title]="review.comment">{{ review.comment || 'Sin comentario' }}</td>
            <td>{{ review.createdAt | date:'shortDate' }}</td>
            <td>
              <span class="badge" [class.active]="review.isActive">
                {{ review.isActive ? 'Activa' : 'Inactiva' }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button class="btn-toggle" [class.inactive-btn]="review.isActive" (click)="toggleStatus(review)">
                  {{ review.isActive ? 'Ocultar' : 'Publicar' }}
                </button>
                <button class="btn-delete" (click)="deleteReview(review)">
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div *ngIf="!loading && reviews.length === 0" class="empty-state">
        No se encontraron reseñas.
      </div>
    </div>
  `,
  styles: [`
    .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .table-container { padding: 1rem; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 1rem; color: rgba(255,255,255,0.6); font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.1); }
    td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .comment-cell { max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; background: rgba(255,255,255,0.1); }
    .badge.active { background: rgba(0, 255, 128, 0.2); color: #00ff80; }
    .loading-state, .empty-state, .error-state { padding: 3rem; text-align: center; color: rgba(255,255,255,0.5); }
    .error-state { color: #ff4d4d; }
    .action-buttons { display: flex; gap: 0.5rem; }
    .btn-toggle, .btn-delete { border: none; padding: 0.4rem 0.8rem; border-radius: 8px; cursor: pointer; transition: 0.3s; font-size: 0.75rem; font-weight: bold; }
    .btn-toggle { background: #00ff80; color: #000; }
    .btn-toggle:hover { opacity: 0.8; }
    .btn-toggle.inactive-btn { background: rgba(255,255,255,0.1); color: #fff; }
    .btn-toggle.inactive-btn:hover { background: rgba(255,77,77,0.2); color: #ff4d4d; }
    .btn-delete { background: rgba(255, 77, 77, 0.1); color: #ff4d4d; }
    .btn-delete:hover { background: #ff4d4d; color: #fff; }
    .stars { color: rgba(255,255,255,0.2); }
    .star.filled { color: #ffd700; }
  `]
})
export class AdminReviewsComponent implements OnInit {
  private reviewsService = inject(ReviewsService);
  private cdr = inject(ChangeDetectorRef);
  
  reviews: Review[] = [];
  loading = true;
  errorMessage = '';

  ngOnInit() {
    this.fetchReviews();
  }

  fetchReviews() {
    this.loading = true;
    this.errorMessage = '';
    this.reviewsService.getReviews().subscribe({
      next: (data) => {
        this.reviews = data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching reviews', err);
        this.errorMessage = err.status === 401 ? 'No autorizado.' : (err.message || 'Error de conexión');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleStatus(review: Review) {
    const newStatus = !review.isActive;
    this.reviewsService.updateReviewStatus(review.id, newStatus).subscribe({
      next: (updatedReview) => {
        review.isActive = updatedReview.isActive;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error updating review', err);
        alert('Error al actualizar el estado de la reseña');
      }
    });
  }

  deleteReview(review: Review) {
    if (confirm('¿Estás seguro de que deseas eliminar esta reseña permanentemente?')) {
      this.reviewsService.deleteReview(review.id).subscribe({
        next: () => {
          this.reviews = this.reviews.filter(r => r.id !== review.id);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error deleting review', err);
          alert('Error al eliminar la reseña');
        }
      });
    }
  }
}
