import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewsService } from '../../core/services/reviews.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="view-header">
      <h2>Gestión de Reseñas</h2>
    </div>
    
    <div class="table-container glass">
      @if (loading) {
        <div class="loading-state">Cargando reseñas...</div>
      }

      @if (errorMessage) {
        <div class="error-state">
          <p>Error: {{ errorMessage }}</p>
          <button class="btn-primary" (click)="fetchReviews()">Reintentar</button>
        </div>
      }
      
      @if (!loading && !errorMessage && reviews.length > 0) {
        <!-- Vista Desktop -->
        <table class="desktop-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Puntuación</th>
              <th>Comentario</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (r of reviews; track r.id) {
              <tr>
                <td>
                  <div class="user-name">{{ r.user?.name || 'Usuario' }}</div>
                  <div class="user-email">{{ r.user?.email || '' }}</div>
                </td>
                <td>
                  <div class="rating-display">
                    <span class="stars">{{ getStars(r.rating) }}</span>
                    <span class="rating-num">{{ r.rating }}/5</span>
                  </div>
                </td>
                <td class="comment-cell">{{ r.comment }}</td>
                <td class="date-cell">{{ r.createdAt | date:'shortDate' }}</td>
                <td>
                  <button class="btn-icon delete" (click)="deleteReview(r.id)">Eliminar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>

        <!-- Vista Mobile -->
        <div class="mobile-cards">
          @for (r of reviews; track r.id) {
            <div class="mobile-card glass">
              <div class="card-row">
                <span class="card-label">Usuario</span>
                <div class="card-value">{{ r.user?.name || 'Usuario' }}</div>
              </div>
              <div class="card-row">
                <span class="card-label">Puntuación</span>
                <div class="card-value">
                  <span class="stars">{{ getStars(r.rating) }}</span>
                  <span class="rating-num">{{ r.rating }}/5</span>
                </div>
              </div>
              <div class="card-row">
                <span class="card-label">Comentario</span>
                <div class="card-value comment-mobile">{{ r.comment }}</div>
              </div>
              <div class="card-row">
                <span class="card-label">Fecha</span>
                <div class="card-value">{{ r.createdAt | date:'shortDate' }}</div>
              </div>
              <div class="card-actions">
                <button class="btn-icon delete" (click)="deleteReview(r.id)">Eliminar</button>
              </div>
            </div>
          }
        </div>
      }

      @if (!loading && !errorMessage && reviews.length === 0) {
        <div class="empty-state">
          No hay reseñas registradas.
        </div>
      }
    </div>
  `,
  styles: [`
    .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .table-container { padding: 1rem; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 1rem; color: rgba(255,255,255,0.6); font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.1); }
    td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .loading-state, .empty-state, .error-state { padding: 3rem; text-align: center; color: rgba(255,255,255,0.5); }
    .error-state { color: #ff4d4d; }
    
    .user-name { font-weight: 600; }
    .user-email { font-size: 0.75rem; color: rgba(255,255,255,0.4); }
    
    .rating-display { display: flex; align-items: center; gap: 0.5rem; }
    .stars { color: #facc15; font-size: 1rem; }
    .rating-num { font-weight: 600; font-size: 0.85rem; color: rgba(255,255,255,0.7); }
    
    .comment-cell { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: rgba(255,255,255,0.8); }
    .comment-mobile { font-size: 0.85rem; text-align: right; max-width: 200px; word-wrap: break-word; }
    .date-cell { color: rgba(255,255,255,0.5); font-size: 0.85rem; }
    
    .btn-icon { background: none; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.4rem 0.8rem; border-radius: 8px; cursor: pointer; margin-right: 0.5rem; transition: 0.3s; font-size: 0.75rem; }
    .btn-icon:hover { background: rgba(255,255,255,0.05); }
    .btn-icon.delete:hover { border-color: #ff4d4d; color: #ff4d4d; }

    .mobile-cards { display: none; }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .view-header { flex-direction: column; align-items: stretch; gap: 1rem; }
      
      .desktop-table { display: none; }
      .mobile-cards { display: flex; flex-direction: column; gap: 1.5rem; }
      
      .mobile-card {
        padding: 1rem;
        background: rgba(255,255,255,0.02);
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.05);
      }
      
      .card-row {
        display: flex; justify-content: space-between; align-items: center;
        padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);
      }
      
      .card-label { font-weight: 500; color: rgba(255,255,255,0.6); }
      .card-value { color: white; text-align: right; font-weight: 500; }
      
      .card-actions { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; }
      .card-actions .btn-icon { width: 100%; margin: 0; text-align: center; padding: 0.75rem; }
    }
  `]
})
export class AdminReviewsComponent implements OnInit {
  private reviewsService = inject(ReviewsService);
  private cdr = inject(ChangeDetectorRef);
  
  reviews: any[] = [];
  loading = true;
  errorMessage = '';

  ngOnInit() {
    this.fetchReviews();
  }

  fetchReviews() {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.reviewsService.getReviews()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.reviews = data;
        },
        error: (err) => {
          console.error('Error fetching reviews:', err);
          this.errorMessage = err.status === 401 ? 'No autorizado.' : 'Error al cargar las reseñas.';
        }
      });
  }

  getStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  deleteReview(id: number) {
    if (confirm('¿Estás seguro de eliminar esta reseña?')) {
      this.reviewsService.deleteReview(id).subscribe({
        next: () => this.fetchReviews(),
        error: (err) => {
          console.error('Error deleting review', err);
          alert('Error al eliminar la reseña');
        }
      });
    }
  }
}
